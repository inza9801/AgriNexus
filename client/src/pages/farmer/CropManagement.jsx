import { useState, useEffect } from "react";
import "./css/CropManagement.css";

import {
  getLatestSensorReading,
  submitSensorReading,
  getFertilizerOptions,
  getFarms,
  createFarm,
  getFields,
  createField,
  getCrops,
  createCrop,
  updateCrop,
} from "../../api/farmerService";

const GROWTH_STAGES = ["Seedling", "Tillering", "Vegetative", "Flowering", "Grain Filling", "Harvest Ready"];
const HEALTH_STATUSES = ["Healthy", "Diseased", "Needs Attention"];

function CropManagement() {
  const [error, setError] = useState("");

  // Farms / Fields / Crops setup state
  const [farms, setFarms] = useState([]);
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [setupLoading, setSetupLoading] = useState(true);

  // Field filter for the crop table below (only rendered once there's more
  // than one field — otherwise every crop for the farmer's single field is
  // shown, same as before).
  const [selectedFieldId, setSelectedFieldId] = useState("");

  // Inline per-row edits for growth stage / health status, keyed by crop_id.
  const [rowEdits, setRowEdits] = useState({});

  // Add Farm form (only shown when the farmer has zero farms)
  const [farmForm, setFarmForm] = useState({ farm_name: "", location: "", total_area_acres: "" });
  const [farmSubmitting, setFarmSubmitting] = useState(false);
  const [farmMessage, setFarmMessage] = useState("");

  // Add Field form (always available — a farm can have any number of fields)
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldForm, setFieldForm] = useState({ field_name: "", area_acres: "", soil_type: "" });
  const [fieldSubmitting, setFieldSubmitting] = useState(false);
  const [fieldMessage, setFieldMessage] = useState("");

  // Add Crop form
  const [showCropForm, setShowCropForm] = useState(false);
  const [cropForm, setCropForm] = useState({
    field_id: "",
    crop_name: "",
    planting_date: "",
    expected_harvest_date: "",
    expected_yield_tons: "",
  });
  const [cropSubmitting, setCropSubmitting] = useState(false);
  const [cropMessage, setCropMessage] = useState("");

  // Latest live sensor reading — soil_moisture_percent/soil_temperature_celsius
  // are read from here (not editable) and carried over whenever a new N/P/K/pH
  // reading is saved below. Sensor entry stays scoped to the selected field.
  const [latestReading, setLatestReading] = useState(null);
  const [soilOptions, setSoilOptions] = useState([]);
  const [sensorForm, setSensorForm] = useState({
    nitrogen_kgha: "",
    phosphorus_kgha: "",
    potassium_kgha: "",
    ph: "",
    soil_type: "",
  });
  const [sensorSubmitting, setSensorSubmitting] = useState(false);
  const [sensorMessage, setSensorMessage] = useState("");

  const loadSetupData = async () => {
    try {
      const [farmsRes, fieldsRes] = await Promise.all([getFarms(), getFields()]);
      setFarms(farmsRes.data.data || []);
      setFields(fieldsRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load farm/field setup");
    }
  };

  const loadCrops = async (fieldId) => {
    try {
      const res = await getCrops(fieldId || undefined);
      setCrops(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load crop data");
    }
  };

  useEffect(() => {
    (async () => {
      await loadSetupData();
      await loadCrops();
      setSetupLoading(false);
    })();
  }, []);

  // Sensor entry defaults to the farmer's first field once fields have
  // loaded, or to whichever field is picked below when there's more than one.
  const sensorFieldId = selectedFieldId || fields[0]?.field_id || "";

  useEffect(() => {
    if (!sensorFieldId) return;
    (async () => {
      try {
        const [latestRes, optionsRes] = await Promise.all([
          getLatestSensorReading(sensorFieldId),
          getFertilizerOptions(),
        ]);
        setLatestReading(latestRes.data.data);
        setSoilOptions(optionsRes.data.data.soils || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [sensorFieldId]);

  const handleFieldFilterChange = (e) => {
    const value = e.target.value;
    setSelectedFieldId(value);
    loadCrops(value || undefined);
  };

  /* ------------------------------- Add Farm ------------------------------ */
  const handleFarmChange = (e) => setFarmForm({ ...farmForm, [e.target.name]: e.target.value });

  const handleFarmSubmit = async (e) => {
    e.preventDefault();
    setFarmMessage("");
    setFarmSubmitting(true);
    try {
      await createFarm({
        farm_name: farmForm.farm_name,
        location: farmForm.location,
        total_area_acres: farmForm.total_area_acres ? parseFloat(farmForm.total_area_acres) : null,
      });
      setFarmForm({ farm_name: "", location: "", total_area_acres: "" });
      setFarmMessage("success");
      await loadSetupData();
    } catch (err) {
      console.error(err);
      setFarmMessage(err?.response?.data?.message || "error");
    } finally {
      setFarmSubmitting(false);
    }
  };

  /* ------------------------------- Add Field ------------------------------ */
  const handleFieldChange = (e) => setFieldForm({ ...fieldForm, [e.target.name]: e.target.value });

  const handleFieldSubmit = async (e) => {
    e.preventDefault();
    setFieldMessage("");
    setFieldSubmitting(true);
    try {
      await createField({
        field_name: fieldForm.field_name,
        area_acres: fieldForm.area_acres ? parseFloat(fieldForm.area_acres) : null,
        soil_type: fieldForm.soil_type || null,
      });
      setFieldForm({ field_name: "", area_acres: "", soil_type: "" });
      setFieldMessage("success");
      setShowFieldForm(false);
      await loadSetupData();
    } catch (err) {
      console.error(err);
      setFieldMessage(err?.response?.data?.message || "error");
    } finally {
      setFieldSubmitting(false);
    }
  };

  /* ------------------------------- Add Crop ------------------------------ */
  const handleCropChange = (e) => setCropForm({ ...cropForm, [e.target.name]: e.target.value });

  const handleCropSubmit = async (e) => {
    e.preventDefault();
    setCropMessage("");
    setCropSubmitting(true);
    try {
      await createCrop({
        field_id: cropForm.field_id,
        crop_name: cropForm.crop_name,
        planting_date: cropForm.planting_date || null,
        expected_harvest_date: cropForm.expected_harvest_date || null,
        expected_yield_tons: cropForm.expected_yield_tons ? parseFloat(cropForm.expected_yield_tons) : null,
      });
      setCropForm({ field_id: "", crop_name: "", planting_date: "", expected_harvest_date: "", expected_yield_tons: "" });
      setCropMessage("success");
      setShowCropForm(false);
      await loadCrops(selectedFieldId || undefined);
    } catch (err) {
      console.error(err);
      setCropMessage(err?.response?.data?.message || "error");
    } finally {
      setCropSubmitting(false);
    }
  };

  /* --------------------------- Crop table edits --------------------------- */
  const getRowEdit = (crop) =>
    rowEdits[crop.crop_id] || { growth_stage: crop.growth_stage, health_status: crop.health_status };

  const handleRowEditChange = (crop_id, field, value) => {
    setRowEdits((prev) => ({
      ...prev,
      [crop_id]: { ...(prev[crop_id] || {}), [field]: value },
    }));
  };

  const handleRowSave = async (crop) => {
    const edit = getRowEdit(crop);
    try {
      await updateCrop(crop.crop_id, {
        growth_stage: edit.growth_stage,
        health_status: edit.health_status,
      });
      setCrops((prev) =>
        prev.map((c) =>
          c.crop_id === crop.crop_id ? { ...c, growth_stage: edit.growth_stage, health_status: edit.health_status } : c
        )
      );
      alert("Crop updated successfully");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  /* ------------------------------- Sensors -------------------------------- */
  const handleSensorChange = (e) => {
    setSensorForm({ ...sensorForm, [e.target.name]: e.target.value });
  };

  // Saves N/P/K/pH/soil type into the sensors table for the field currently
  // being worked on, carrying over the current live soil_moisture_percent/
  // soil_temperature_celsius reading.
  const handleSensorSubmit = async (e) => {
    e.preventDefault();
    setSensorMessage("");
    setSensorSubmitting(true);
    try {
      const res = await submitSensorReading(
        {
          soil_moisture_percent: latestReading?.soil_moisture_percent ?? 0,
          soil_temperature_celsius: latestReading?.soil_temperature_celsius ?? 0,
          nitrogen_kgha: parseFloat(sensorForm.nitrogen_kgha),
          phosphorus_kgha: parseFloat(sensorForm.phosphorus_kgha),
          potassium_kgha: parseFloat(sensorForm.potassium_kgha),
          ph: parseFloat(sensorForm.ph),
          soil_type: sensorForm.soil_type,
        },
        sensorFieldId
      );
      setLatestReading(res.data.data);
      setSensorForm({
        nitrogen_kgha: "",
        phosphorus_kgha: "",
        potassium_kgha: "",
        ph: "",
        soil_type: "",
      });
      setSensorMessage("success");
    } catch (err) {
      console.error(err);
      setSensorMessage("error");
    } finally {
      setSensorSubmitting(false);
    }
  };

  const totalYield = crops.reduce((sum, c) => sum + Number(c.expected_yield_tons || 0), 0);
  const overallHealth = crops.length
    ? crops.every((c) => c.health_status === "Healthy")
      ? "Healthy"
      : "Diseased"
    : "--";

  return (
    <div className="cropManagement">
      <div className="pageHeader">
        <h1>Crop Management</h1>
        <p>
          Monitor crop growth, manage cultivation, track health status and
          expected harvest.
        </p>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* SUMMARY CARDS */}
      <div className="summaryGrid">
        <div className="summaryCard">
          <h3>Total Fields</h3>
          <h1 className="heading">{fields.length}</h1>
          <p>Active cultivation area</p>
        </div>

        <div className="summaryCard">
          <h3>Crop Health</h3>
          <h1 className="heading">{overallHealth}</h1>
          <p>Current Status</p>
        </div>

        <div className="summaryCard">
          <h3>Expected Yield</h3>
          <h1 className="heading">{crops.length ? `${totalYield.toFixed(2)} Ton` : "--"}</h1>
          <p>Estimated production</p>
        </div>
      </div>

      {/* FARM SETUP — one-time. Once the farmer has a farm this section is
          replaced by the farm's name/location, since only one farm is
          supported per account. */}
      {!setupLoading && farms.length === 0 && (
        <div className="setupSection">
          <div className="sectionTitle">
            <h2>Set Up Your Farm</h2>
          </div>
          <p className="setupNote">
            Create your farm once — you can add as many fields to it as you like afterward.
          </p>
          <form onSubmit={handleFarmSubmit} className="setupForm">
            <input
              type="text"
              name="farm_name"
              placeholder="Farm Name"
              value={farmForm.farm_name}
              onChange={handleFarmChange}
              required
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={farmForm.location}
              onChange={handleFarmChange}
            />
            <input
              type="number"
              step="0.01"
              name="total_area_acres"
              placeholder="Total Area (Acres)"
              value={farmForm.total_area_acres}
              onChange={handleFarmChange}
            />
            <button type="submit" disabled={farmSubmitting}>
              {farmSubmitting ? "Saving..." : "Create Farm"}
            </button>
          </form>
          {farmMessage === "success" && <span className="updateSuccess">Farm created successfully</span>}
          {farmMessage && farmMessage !== "success" && <span className="updateError">{farmMessage}</span>}
        </div>
      )}

      {!setupLoading && farms.length > 0 && (
        <div className="farmSummaryBar">
          <span>
            <strong>Farm:</strong> {farms[0].farm_name}
            {farms[0].location ? ` — ${farms[0].location}` : ""}
          </span>
          <button type="button" className="secondaryBtn" onClick={() => setShowFieldForm((v) => !v)}>
            {showFieldForm ? "Cancel" : "+ Add Field"}
          </button>
        </div>
      )}

      {/* FIELD SETUP — available any time after the farm exists; a farm can
          have any number of fields. */}
      {showFieldForm && (
        <div className="setupSection">
          <div className="sectionTitle">
            <h2>Add a Field</h2>
          </div>
          <form onSubmit={handleFieldSubmit} className="setupForm">
            <input
              type="text"
              name="field_name"
              placeholder="Field Name"
              value={fieldForm.field_name}
              onChange={handleFieldChange}
              required
            />
            <input
              type="number"
              step="0.01"
              name="area_acres"
              placeholder="Area (Acres)"
              value={fieldForm.area_acres}
              onChange={handleFieldChange}
            />
            <input
              type="text"
              name="soil_type"
              placeholder="Soil Type"
              value={fieldForm.soil_type}
              onChange={handleFieldChange}
            />
            <button type="submit" disabled={fieldSubmitting}>
              {fieldSubmitting ? "Saving..." : "Add Field"}
            </button>
          </form>
          {fieldMessage === "success" && <span className="updateSuccess">Field added successfully</span>}
          {fieldMessage && fieldMessage !== "success" && <span className="updateError">{fieldMessage}</span>}
        </div>
      )}

      {/* SOIL & NUTRIENT SENSOR ENTRY (N/P/K/pH/soil type -> saved to sensors table) */}
      {fields.length > 0 && (
        <div className="sensorUpdateSection">
          <div className="sectionTitle">
            <h2>Update Soil & Nutrient Sensors</h2>
          </div>

          {fields.length > 1 && (
            <div className="inlineFieldPicker">
              <label htmlFor="sensorFieldPicker">Field:</label>
              <select
                id="sensorFieldPicker"
                value={sensorFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
              >
                {fields.map((f) => (
                  <option key={f.field_id} value={f.field_id}>
                    {f.field_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p className="sensorUpdateNote">
            Soil moisture ({latestReading ? `${latestReading.soil_moisture_percent}%` : "--"}) and soil
            temperature ({latestReading ? `${latestReading.soil_temperature_celsius}°C` : "--"}) are
            read automatically from the live IoT feed.
          </p>

          <form onSubmit={handleSensorSubmit} className="sensorUpdateForm">
            <input
              type="number"
              step="0.01"
              name="nitrogen_kgha"
              placeholder="Nitrogen (kg/ha)"
              value={sensorForm.nitrogen_kgha}
              onChange={handleSensorChange}
              required
            />
            <input
              type="number"
              step="0.01"
              name="phosphorus_kgha"
              placeholder="Phosphorus (kg/ha)"
              value={sensorForm.phosphorus_kgha}
              onChange={handleSensorChange}
              required
            />
            <input
              type="number"
              step="0.01"
              name="potassium_kgha"
              placeholder="Potassium (kg/ha)"
              value={sensorForm.potassium_kgha}
              onChange={handleSensorChange}
              required
            />
            <input
              type="number"
              step="0.01"
              min="0"
              max="14"
              name="ph"
              placeholder="Soil pH"
              value={sensorForm.ph}
              onChange={handleSensorChange}
              required
            />
            <select
              name="soil_type"
              value={sensorForm.soil_type}
              onChange={handleSensorChange}
              required
            >
              <option value="" disabled>
                Select Soil Type
              </option>
              {soilOptions.map((soil) => (
                <option key={soil} value={soil}>
                  {soil}
                </option>
              ))}
            </select>
            <button type="submit" disabled={sensorSubmitting}>
              {sensorSubmitting ? "Saving..." : "Save Reading"}
            </button>
          </form>

          {sensorMessage === "success" && (
            <span className="updateSuccess">Sensor reading saved successfully</span>
          )}
          {sensorMessage === "error" && (
            <span className="updateError">Failed to save sensor reading</span>
          )}
        </div>
      )}

      {/* CROP TABLE */}
      <div className="cropTableSection">
        <div className="sectionTitle cropTableHeader">
          <h2>Crop Inventory</h2>
          <div className="cropTableActions">
            {fields.length > 1 && (
              <select className="fieldFilterSelect" value={selectedFieldId} onChange={handleFieldFilterChange}>
                <option value="">All Fields</option>
                {fields.map((f) => (
                  <option key={f.field_id} value={f.field_id}>
                    {f.field_name}
                  </option>
                ))}
              </select>
            )}
            {fields.length > 0 && (
              <button type="button" className="secondaryBtn" onClick={() => setShowCropForm((v) => !v)}>
                {showCropForm ? "Cancel" : "+ Add Crop"}
              </button>
            )}
          </div>
        </div>

        {showCropForm && (
          <form onSubmit={handleCropSubmit} className="setupForm cropAddForm">
            <select name="field_id" value={cropForm.field_id} onChange={handleCropChange} required>
              <option value="" disabled>
                Select Field
              </option>
              {fields.map((f) => (
                <option key={f.field_id} value={f.field_id}>
                  {f.field_name}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="crop_name"
              placeholder="Crop Name"
              value={cropForm.crop_name}
              onChange={handleCropChange}
              required
            />
            <input
              type="date"
              name="planting_date"
              placeholder="Planting Date"
              value={cropForm.planting_date}
              onChange={handleCropChange}
            />
            <input
              type="date"
              name="expected_harvest_date"
              placeholder="Expected Harvest Date"
              value={cropForm.expected_harvest_date}
              onChange={handleCropChange}
            />
            <input
              type="number"
              step="0.01"
              name="expected_yield_tons"
              placeholder="Expected Yield (Tons)"
              value={cropForm.expected_yield_tons}
              onChange={handleCropChange}
            />
            <button type="submit" disabled={cropSubmitting}>
              {cropSubmitting ? "Saving..." : "Add Crop"}
            </button>
          </form>
        )}
        {cropMessage === "success" && <span className="updateSuccess">Crop added successfully</span>}
        {cropMessage && cropMessage !== "success" && <span className="updateError">{cropMessage}</span>}

        <div className="tableContainer">
          <table className="cropTable">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Field</th>
                <th>Area</th>
                <th>Planting Date</th>
                <th>Growth Stage</th>
                <th>Health</th>
                <th>Expected Harvest</th>
                <th>Expected Yield</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {crops.length === 0 && (
                <tr>
                  <td colSpan={9} className="emptyRow">
                    {fields.length === 0
                      ? "Set up your farm and a field to start adding crops."
                      : 'No crops yet — use "+ Add Crop" above to add one.'}
                  </td>
                </tr>
              )}
              {crops.map((crop) => {
                const edit = getRowEdit(crop);
                return (
                  <tr key={crop.crop_id}>
                    <td>{crop.crop_name}</td>
                    <td>{crop.field_name || "--"}</td>
                    <td>{crop.area_acres ? `${crop.area_acres} Acres` : "--"}</td>
                    <td>{crop.planting_date ? crop.planting_date.split("T")[0] : "--"}</td>
                    <td>
                      <select
                        className="cropSelect"
                        value={edit.growth_stage}
                        onChange={(e) => handleRowEditChange(crop.crop_id, "growth_stage", e.target.value)}
                      >
                        {GROWTH_STAGES.map((stage) => (
                          <option key={stage}>{stage}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="cropSelect"
                        value={edit.health_status}
                        onChange={(e) => handleRowEditChange(crop.crop_id, "health_status", e.target.value)}
                      >
                        {HEALTH_STATUSES.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>{crop.expected_harvest_date ? crop.expected_harvest_date.split("T")[0] : "--"}</td>
                    <td>{crop.expected_yield_tons ? `${crop.expected_yield_tons} Ton` : "--"}</td>
                    <td className="actionCell">
                      <button className="saveBtn" onClick={() => handleRowSave(crop)}>
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CropManagement;
