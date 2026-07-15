import { useState, useEffect } from "react";
import "./css/Dashboard.css";
import {
  FaLeaf,
  FaSun,
  FaCloud,
  FaCloudRain,
  FaTint,
  FaShoppingBasket,
  FaFlask,
  FaLightbulb,
} from "react-icons/fa";
import {
  getDashboardSummary,
  getCrop,
  getLatestSensorReading,
  getWeather,
} from "../../api/farmerService";
import FieldSelector from "../../components/common/FieldSelector";

// Picks the weather icon for the current condition (sunny / overcast / rainy)
function WeatherIcon({ condition }) {
  if (condition === "sunny") return <FaSun className="cardIcon weatherIcon sunny" />;
  if (condition === "rainy") return <FaCloudRain className="cardIcon weatherIcon rainy" />;
  return <FaCloud className="cardIcon weatherIcon overcast" />;
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [crop, setCrop] = useState(null);
  const [sensor, setSensor] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Selected field (only meaningful once the farmer has more than one
  // field — FieldSelector renders nothing otherwise, and this stays null
  // so every call below falls back to the farmer-wide/default behaviour).
  const [fieldId, setFieldId] = useState(null);

  const loadDashboardData = async (selectedFieldId) => {
    try {
      const [summaryRes, cropRes, sensorRes] = await Promise.all([
        getDashboardSummary(selectedFieldId),
        getCrop(selectedFieldId),
        getLatestSensorReading(selectedFieldId),
      ]);
      setSummary(summaryRes.data.data);
      setCrop(cropRes.data.data);
      setSensor(sensorRes.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    }
  };

  const loadWeather = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await getWeather(latitude, longitude);
          setWeather(res.data.data);
        } catch (err) {
          console.error(err);
          setError("Failed to load weather data");
        }
      },
      () => setError("Location permission denied — weather unavailable"),
    );
  };

  useEffect(() => {
    (async () => {
      await loadDashboardData(null);
      loadWeather();
      setLoading(false);
    })();
  }, []);

  // Refetch scoped data whenever the farmer picks a different field.
  useEffect(() => {
    if (fieldId === null) return;
    loadDashboardData(fieldId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId]);

  if (loading) return <div className="dashboard">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1 className="headings">Overview Dashboard</h1>
      <p className="subtitle">Smart Agriculture Monitoring System</p>

      <FieldSelector onChange={setFieldId} />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Top Cards */}
      <div className="cards">
        <div className="card">
          <FaLeaf className="cardIcon" />
          <h3>Crop Health</h3>
          <h2 className="headings">{summary?.cropHealth || "N/A"}</h2>
          <p>Current Status</p>
        </div>

        <div className="card">
          <WeatherIcon condition={weather?.condition} />
          <h3>Weather</h3>
          <h2 className="headings">
            {weather ? `${weather.temperature}°C` : "Loading..."}
          </h2>
          <p className={`weatherTag ${weather?.condition || ""}`}>
            {weather
              ? weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)
              : ""}
          </p>
        </div>

        <div className="card">
          <FaCloudRain className="cardIcon" />
          <h3>Rain Probability</h3>
          <h2 className="headings">
            {weather ? `${weather.rainProbability}%` : "--"}
          </h2>
          <p>Chance of rainfall</p>
        </div>

        <div className="card">
          <FaShoppingBasket className="cardIcon" />
          <h3>Marketplace</h3>
          <h2 className="headings">
            {summary ? summary.marketplaceListings : "N/A"}
          </h2>
          <p>Active Listings</p>
        </div>
      </div>

      {/* Sensor Cards (real data — loaded entirely from the API, taken from
          both ML datasets: soil/nutrient sensors + live weather feed) */}
      <div className="section">
        <h2 className="headings">Live IoT Sensor Data</h2>
        <div className="sensorGrid">
          <div className="sensorCard">
            <h3>Soil Moisture</h3>
            <h1>{sensor ? `${sensor.soil_moisture_percent} %` : "--"}</h1>
          </div>
          <div className="sensorCard">
            <h3>Soil Temperature</h3>
            <h1>{sensor ? `${sensor.soil_temperature_celsius} °C` : "--"}</h1>
          </div>
          <div className="sensorCard">
            <h3>Nitrogen</h3>
            <h1>{sensor ? `${sensor.nitrogen_kgha} kg/ha` : "--"}</h1>
          </div>
          <div className="sensorCard">
            <h3>Phosphorus</h3>
            <h1>{sensor ? `${sensor.phosphorus_kgha} kg/ha` : "--"}</h1>
          </div>
          <div className="sensorCard">
            <h3>Potassium</h3>
            <h1>{sensor ? `${sensor.potassium_kgha} kg/ha` : "--"}</h1>
          </div>
          <div className="sensorCard">
            <h3>Soil pH</h3>
            <h1>{sensor ? sensor.ph : "--"}</h1>
          </div>
          <div className="sensorCard">
            <h3>Soil Type</h3>
            <h1>{sensor ? sensor.soil_type : "--"}</h1>
          </div>
          <div className="sensorCard">
            <h3>Air Humidity</h3>
            <h1>{weather ? `${weather.humidity} %` : "--"}</h1>
          </div>
          <div className="sensorCard">
            <h3>Rainfall</h3>
            <h1>{weather ? `${weather.rainfall} mm` : "--"}</h1>
          </div>
          <div className="sensorCard">
            <h3>Light Intensity</h3>
            <h1>{weather ? `${weather.lightIntensity} W/m²` : "--"}</h1>
          </div>
        </div>
      </div>

      {/* Crop Table — single crop (Rice) */}
      <div className="section">
        <h2 className="headings">Crop Management Summary</h2>
        <table className="cropTable">
          <thead>
            <tr>
              <th>Crop</th>
              <th>Growth Stage</th>
              <th>Health</th>
              <th>Expected Harvest</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{crop?.crop_name || "Rice"}</td>
              <td>{crop?.growth_stage || "--"}</td>
              <td>{crop?.health_status || "--"}</td>
              <td>{crop?.expected_harvest_date || "--"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
