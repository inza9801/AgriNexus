import api from "./axios.js";

// Small helper: appends ?field_id= only when one is actually supplied, so
// every call below stays backward-compatible for farmers with a single field.
const fieldQuery = (fieldId) => (fieldId ? `?field_id=${fieldId}` : "");

export const getDashboardSummary = (fieldId) =>
  api.get(`/crops/dashboard-summary${fieldQuery(fieldId)}`);
export const getCrop = (fieldId) => api.get(`/crops${fieldQuery(fieldId)}`);
export const getLatestSensorReading = (fieldId) => api.get(`/sensors/latest${fieldQuery(fieldId)}`);
export const submitSensorReading = (data, fieldId) =>
  api.post(`/sensors${fieldQuery(fieldId)}`, data);
export const getWeather = (lat, lon) => api.get(`/weather?lat=${lat}&lon=${lon}`);
export const getSensorHistory = (fieldId) => api.get(`/sensors/history${fieldQuery(fieldId)}`);

// ML (fertilizer + irrigation recommendations)
export const getFertilizerOptions = () => api.get("/ml/fertilizer-options");
export const predictFertilizer = (data, fieldId) =>
  api.post(`/ml/predict-fertilizer${fieldQuery(fieldId)}`, data);
export const predictIrrigation = (data, fieldId) =>
  api.post(`/ml/predict-irrigation${fieldQuery(fieldId)}`, data);

// Farms / Fields — a farmer has at most one farm; fields belong to it.
// Field location is never sent/stored — the device's live geolocation is
// used wherever location matters (weather), same as before.
export const getFarms = () => api.get("/farms");
export const createFarm = (data) => api.post("/farms", data);
export const getFields = () => api.get("/fields");
export const createField = (data) => api.post("/fields", data);

// Crops — getCrops(fieldId) with no fieldId returns every crop across every
// field (field/farm name included); pass a fieldId to scope to one field.
export const getCrops = (fieldId) => api.get(`/crops/all${fieldQuery(fieldId)}`);
export const createCrop = (data) => api.post("/crops", data);

// Disease detection — sends the image as multipart/form-data. The file is
// only ever held in memory on the way through; nothing is saved server-side.
export const predictDisease = (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  return api.post("/ml/predict-disease", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getUnsoldBatches = () => api.get("/warehouse/batches");
export const getWarehouseSummary = () => api.get("/warehouse/summary");

export const getListableBatches = () => api.get("/marketplace/listable-batches");
export const createListing = (data) => api.post("/marketplace/listings", data);
export const getListingsSummary = () => api.get("/marketplace/summary");
export const getBuyerRequests = () => api.get("/marketplace/requests");
export const confirmOrder = (id) => api.patch(`/marketplace/requests/${id}/confirm`);
export const cancelOrder = (id) => api.patch(`/marketplace/requests/${id}/cancel`);

export const getOrders = () => api.get("/orders");
export const getPickups = () => api.get("/orders/pickups");
export const getShipments = () => api.get("/orders/shipments");

export const updateGrowthStage = (crop_id, growth_stage) => api.patch(`/crops/${crop_id}/growth-stage`, { growth_stage });
export const getAllBatches = () => api.get("/warehouse/all-batches");
export const addBatch = (data) => api.post("/warehouse/batches", data);

export const getProducts = () => api.get("/products");
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);

export const updateCrop = (crop_id, data) => api.patch(`/crops/${crop_id}`, data);