import express from "express";

import {
  getCrop,
  getCrops,
  addCrop,
  getDashboardSummary,
  listableBatches,
  addListing,
  summary,
  requests,
  confirmOrder,
  cancelOrder,
  listOrders,
  listShipments,
  addSensorReading,
  getLatestReading,
  getHistory,
  getCurrentWeather,
  listBatches,
  getSummary,
  updateCropStatus,
  createBatch,
  getFertilizerOptions,
  predictFertilizer,
  predictIrrigation,
  predictDisease,
  getFarms,
  addFarm,
  getFields,
  addField,
} from "../controllers/farmerController.js";

import {
  protect,
  protectRole,
} from "../middleware/authMiddleware.js";

import {
  uploadLeafImage,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

const farmerOnly = [protect, protectRole("farmer")];


/* -------------------------------------------------------------------------- */
/*                              Farms / Fields                                */
/* -------------------------------------------------------------------------- */

router.get("/farms",farmerOnly, getFarms);

router.post("/farms",farmerOnly, addFarm);

router.get("/fields",farmerOnly, getFields);

router.post("/fields",farmerOnly, addField);

/* -------------------------------------------------------------------------- */
/*                                    Crops                                   */
/*  GET /crops              -> latest single crop (optional ?field_id=)       */
/*  GET /crops/all          -> every crop, optionally scoped to ?field_id=    */
/*  POST /crops             -> create a new crop against a field_id           */
/* -------------------------------------------------------------------------- */

router.get("/crops",farmerOnly, getCrop);

router.get("/crops/all",farmerOnly, getCrops);

router.post("/crops",farmerOnly, addCrop);

router.get("/crops/dashboard-summary",farmerOnly, getDashboardSummary);

router.patch("/crops/:crop_id",farmerOnly, updateCropStatus);

/* -------------------------------------------------------------------------- */
/*                                   Sensors                                  */
/* -------------------------------------------------------------------------- */

router.post("/sensors",farmerOnly, addSensorReading);

router.get("/sensors/latest",farmerOnly, getLatestReading);

router.get("/sensors/history",farmerOnly, getHistory);

/* -------------------------------------------------------------------------- */
/*                                   Weather                                  */
/* -------------------------------------------------------------------------- */

router.get("/weather",farmerOnly, getCurrentWeather);    

/* -------------------------------------------------------------------------- */
/*                              Machine Learning                              */
/* -------------------------------------------------------------------------- */

router.get("/ml/fertilizer-options",farmerOnly, getFertilizerOptions);

router.post("/ml/predict-fertilizer",farmerOnly, predictFertilizer);

router.post("/ml/predict-irrigation",farmerOnly, predictIrrigation);

router.post("/ml/predict-disease",farmerOnly, uploadLeafImage.single("image"),predictDisease);

/* -------------------------------------------------------------------------- */
/*                                  Warehouse                                 */
/* -------------------------------------------------------------------------- */

router.get("/warehouse/batches",farmerOnly, listBatches);

router.post("/warehouse/batches",farmerOnly, createBatch);

router.get("/warehouse/summary",farmerOnly, getSummary);

/* -------------------------------------------------------------------------- */
/*                                 Marketplace                                */
/* -------------------------------------------------------------------------- */

router.get("/marketplace/listable-batches",farmerOnly, listableBatches);

router.post("/marketplace/listings",farmerOnly, addListing);

router.get("/marketplace/summary",farmerOnly, summary);

router.get("/marketplace/requests",farmerOnly, requests);

router.patch("/marketplace/requests/:id/confirm", farmerOnly,confirmOrder);

router.patch("/marketplace/requests/:id/cancel",farmerOnly,cancelOrder);

/* -------------------------------------------------------------------------- */
/*                                   Orders                                   */
/* -------------------------------------------------------------------------- */

router.get("/orders",farmerOnly, listOrders);

router.get("/orders/shipments",farmerOnly, listShipments);

export default router;