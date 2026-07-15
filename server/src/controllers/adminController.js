import {
  getIncomingRequests,
  getRequestDetail,
  getAllDriversWithTodayAssignment,
  assignOrderToDriver,
  getAllShipments,
  getDashboardSummary,
  getDeliveryHistorySummary,
  getAssignableOrdersToday,
  getAssignedOrdersToday,
  getAssignedOrderDetail,
} from "../models/adminModel.js";

export const incomingRequests = async (req, res, next) => {
  try {
    const data = await getIncomingRequests();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const requestDetail = async (req, res, next) => {
  try {
    const data = await getRequestDetail(req.params.orderId);
    if (!data) {
      res.status(404);
      throw new Error("Request not found");
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const drivers = async (req, res, next) => {
  try {
    const data = await getAllDriversWithTodayAssignment();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const assignOrder = async (req, res, next) => {
  try {
    const { order_id, driver_id } = req.body;
    if (!order_id || !driver_id) {
      res.status(400);
      throw new Error("order_id and driver_id are required");
    }
    const result = await assignOrderToDriver(order_id, driver_id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const shipments = async (req, res, next) => {
  try {
    const data = await getAllShipments();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const dashboardSummary = async (req, res, next) => {
  try {
    const data = await getDashboardSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const historySummary = async (req, res, next) => {
  try {
    const data = await getDeliveryHistorySummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const assignableOrders = async (req, res, next) => {
  try {
    const data = await getAssignableOrdersToday();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const assignedOrdersToday = async (req, res, next) => {
  try {
    const data = await getAssignedOrdersToday();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const assignedOrderDetail = async (req, res, next) => {
  try {
    const data = await getAssignedOrderDetail(req.params.deliveryId);
    if (!data) {
      res.status(404);
      throw new Error("Assigned order not found");
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};