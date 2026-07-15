import pool from "../config/db.js";

export const getIncomingRequests = async () => {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.order_unique_id, wb.crop_name, o.quantity_tons,
            fu.full_name AS farmer_name, bu.full_name AS buyer_name, o.created_at
     FROM orders o
     JOIN marketplace_listings ml ON o.listing_id = ml.listing_id
     JOIN warehouse_batches wb ON ml.batch_id = wb.batch_id
     JOIN users fu ON wb.farmer_id = fu.user_id
     JOIN users bu ON o.buyer_id = bu.user_id
     WHERE o.order_status = 'Confirmed'
       AND DATE(o.created_at) = CURDATE()
       AND o.order_id NOT IN (SELECT order_id FROM deliveries)
     ORDER BY o.created_at DESC`
  );
  return rows;
};

export const getRequestDetail = async (order_id) => {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.order_unique_id, o.quantity_tons, o.total_price, o.created_at,
            wb.crop_name, wb.grade,
            fu.full_name AS farmer_name, fu.phone_number AS farmer_phone, fu.address AS farmer_address,
            bu.full_name AS buyer_name, bu.phone_number AS buyer_phone, bu.address AS buyer_address
     FROM orders o
     JOIN marketplace_listings ml ON o.listing_id = ml.listing_id
     JOIN warehouse_batches wb ON ml.batch_id = wb.batch_id
     JOIN users fu ON wb.farmer_id = fu.user_id
     JOIN users bu ON o.buyer_id = bu.user_id
     WHERE o.order_id = ?`,
    [order_id]
  );
  return rows[0];
};

export const getAllDriversWithTodayAssignment = async () => {
  const [drivers] = await pool.query(
    `SELECT d.driver_id, u.full_name AS name, u.phone_number AS phone, u.email AS email, d.vehicle_number
     FROM drivers d
     JOIN users u ON d.user_id = u.user_id
     ORDER BY d.driver_id ASC`
  );

  const [assignments] = await pool.query(
    `SELECT d.delivery_id, d.driver_id, o.order_unique_id, d.status AS delivery_status
     FROM deliveries d
     JOIN orders o ON d.order_id = o.order_id
     WHERE DATE(d.assigned_at) = CURDATE() AND d.status != 'Delivered'
     ORDER BY d.assigned_at ASC`
  );

  return drivers.map((driver) => ({
    ...driver,
    todaysOrders: assignments.filter((a) => a.driver_id === driver.driver_id),
  }));
};

// Creating a delivery (status='Assigned') always pushes the parent order to
// 'Processing'.
export const assignOrderToDriver = async (order_id, driver_id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(`SELECT delivery_id FROM deliveries WHERE order_id = ?`, [order_id]);
    if (existing.length > 0) throw new Error("Order already assigned");

    const [orderRows] = await connection.query(`SELECT order_id FROM orders WHERE order_id = ?`, [order_id]);
    if (!orderRows[0]) throw new Error("Order not found");

    const [result] = await connection.query(
      `INSERT INTO deliveries (order_id, driver_id, status) VALUES (?, ?, 'Assigned')`,
      [order_id, driver_id]
    );

    await connection.query(`UPDATE orders SET order_status = 'Processing' WHERE order_id = ?`, [order_id]);

    await connection.commit();
    return { delivery_id: result.insertId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const getAllShipments = async () => {
  const [rows] = await pool.query(
    `SELECT d.delivery_id, o.order_unique_id, wb.crop_name, o.quantity_tons,
            f.location AS pickup_location, bu.address AS drop_location, d.status,
            du.full_name AS driver_name, dr.vehicle_number
     FROM deliveries d
     JOIN orders o ON d.order_id = o.order_id
     JOIN marketplace_listings ml ON o.listing_id = ml.listing_id
     JOIN warehouse_batches wb ON ml.batch_id = wb.batch_id
     JOIN farms f ON f.farmer_id = wb.farmer_id
     JOIN users bu ON o.buyer_id = bu.user_id
     JOIN drivers dr ON d.driver_id = dr.driver_id
     JOIN users du ON dr.user_id = du.user_id
     WHERE d.status != 'Delivered'
     ORDER BY d.assigned_at DESC`
  );
  return rows;
};

export const getDashboardSummary = async () => {
  const [pendingRows] = await pool.query(
    `SELECT COUNT(*) AS pendingRequests FROM orders o
     WHERE o.order_status = 'Confirmed' AND o.order_id NOT IN (SELECT order_id FROM deliveries)`
  );

  const [statusRows] = await pool.query(
    `SELECT
      COUNT(*) AS totalOrdersToday,
      SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) AS assigned,
      SUM(CASE WHEN status = 'Picked Up' THEN 1 ELSE 0 END) AS pickup,
      SUM(CASE WHEN status = 'In Transit' THEN 1 ELSE 0 END) AS inTransit,
      SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS deliveredToday
     FROM deliveries WHERE DATE(assigned_at) = CURDATE()`
  );

  return {
    pendingRequests: pendingRows[0].pendingRequests,
    ...statusRows[0],
  };
};

export const getDeliveryHistorySummary = async () => {
  const [rows] = await pool.query(
    `SELECT
      SUM(CASE WHEN DATE(delivered_at) = CURDATE() THEN 1 ELSE 0 END) AS deliveredToday,
      SUM(CASE WHEN MONTH(delivered_at) = MONTH(CURDATE()) AND YEAR(delivered_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS deliveredThisMonth,
      COUNT(*) AS totalDelivered
     FROM deliveries WHERE status = 'Delivered'`
  );
  return rows[0];
};

export const getAssignableOrdersToday = async () => {
  const [rows] = await pool.query(
    `SELECT o.order_id, o.order_unique_id, wb.crop_name, o.quantity_tons
     FROM orders o
     JOIN marketplace_listings ml ON o.listing_id = ml.listing_id
     JOIN warehouse_batches wb ON ml.batch_id = wb.batch_id
     WHERE o.order_status = 'Confirmed'
       AND DATE(o.created_at) = CURDATE()
       AND o.order_id NOT IN (SELECT order_id FROM deliveries)
     ORDER BY o.created_at DESC`
  );
  return rows;
};

export const getAssignedOrdersToday = async () => {
  const [rows] = await pool.query(
    `SELECT d.delivery_id, o.order_unique_id, fu.full_name AS farmer_name, bu.full_name AS buyer_name,
            du.full_name AS driver_name, dr.vehicle_number, wb.crop_name, o.quantity_tons,
            d.assigned_at, d.status
     FROM deliveries d
     JOIN orders o ON d.order_id = o.order_id
     JOIN marketplace_listings ml ON o.listing_id = ml.listing_id
     JOIN warehouse_batches wb ON ml.batch_id = wb.batch_id
     JOIN users fu ON wb.farmer_id = fu.user_id
     JOIN users bu ON o.buyer_id = bu.user_id
     JOIN drivers dr ON d.driver_id = dr.driver_id
     JOIN users du ON dr.user_id = du.user_id
     WHERE DATE(d.assigned_at) = CURDATE()
     ORDER BY d.assigned_at DESC`
  );
  return rows;
};

export const getAssignedOrderDetail = async (delivery_id) => {
  const [rows] = await pool.query(
    `SELECT d.delivery_id, o.order_unique_id, o.total_price, o.quantity_tons AS order_quantity,
            fu.full_name AS farmer_name, fu.phone_number AS farmer_phone,
            bu.full_name AS buyer_name, bu.phone_number AS buyer_phone,
            du.full_name AS driver_name, du.phone_number AS driver_phone, dr.vehicle_number,
            wb.crop_name, o.quantity_tons, f.location AS pickup_location, bu.address AS drop_location,
            d.status, d.assigned_at, d.picked_up_at, d.in_transit_at, d.delivered_at
     FROM deliveries d
     JOIN orders o ON d.order_id = o.order_id
     JOIN marketplace_listings ml ON o.listing_id = ml.listing_id
     JOIN warehouse_batches wb ON ml.batch_id = wb.batch_id
     JOIN farms f ON f.farmer_id = wb.farmer_id
     JOIN users fu ON wb.farmer_id = fu.user_id
     JOIN users bu ON o.buyer_id = bu.user_id
     JOIN drivers dr ON d.driver_id = dr.driver_id
     JOIN users du ON dr.user_id = du.user_id
     WHERE d.delivery_id = ?`,
    [delivery_id]
  );
  return rows[0];
};
