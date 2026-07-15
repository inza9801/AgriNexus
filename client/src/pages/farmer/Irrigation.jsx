import { useState, useEffect } from "react";
import "./css/Irrigation.css";
import {
  FaTint,
  FaTemperatureHigh,
  FaWater,
  FaCloudRain,
  FaFlask,
  FaLightbulb,
  FaSeedling,
} from "react-icons/fa";
import {
  getLatestSensorReading,
  getWeather,
  predictIrrigation,
} from "../../api/farmerService";
import FieldSelector from "../../components/common/FieldSelector";

function Irrigation() {
  const [latest, setLatest] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

  const [irrigation, setIrrigation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Only meaningful once the farmer has more than one field — see
  // FieldSelector, which stays hidden (and this stays null) otherwise.
  const [fieldId, setFieldId] = useState(null);

  const loadLatest = async (selectedFieldId) => {
    try {
      const res = await getLatestSensorReading(selectedFieldId);
      setLatest(res.data.data);
    } catch (err) {
      setError("Failed to load sensor data");
      console.error(err);
    }
  };

  useEffect(() => {
    (async () => {
      await loadLatest(null);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await getWeather(latitude, longitude);
              setWeather(res.data.data);
            } catch (err) {
              console.error(err);
            }
          },
          () => console.warn("Location permission denied — weather unavailable")
        );
      }
    })();
  }, []);

  // Refetch scoped sensor data whenever the farmer picks a different field.
  useEffect(() => {
    if (fieldId === null) return;
    loadLatest(fieldId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId]);

  // AI Irrigation Recommendation — takes all sensor data (soil moisture and
  // temperature from the latest reading) plus live humidity/light intensity
  // from the weather feed, and asks the ML service for a recommendation.
  // Replaces the previously hardcoded "irrigation needed" flag.
  useEffect(() => {
    if (!latest || !weather) return;
    (async () => {
      try {
        setAiLoading(true);
        setAiError("");
        const res = await predictIrrigation(
          {
            humidity: weather.humidity,
            lightIntensity: weather.lightIntensity,
          },
          fieldId
        );
        setIrrigation(res.data.data);
      } catch (err) {
        setAiError("Failed to get irrigation recommendation");
        console.error(err);
      } finally {
        setAiLoading(false);
      }
    })();
  }, [latest, weather, fieldId]);

  // All sensors data
  const sensorData = [
    {
      icon: <FaTint />,
      title: "Soil Moisture",
      value: latest ? `${latest.soil_moisture_percent} %` : "--",
    },
    {
      icon: <FaTemperatureHigh />,
      title: "Soil Temperature",
      value: latest ? `${latest.soil_temperature_celsius} °C` : "--",
    },
    {
      icon: <FaFlask />,
      title: "Nitrogen",
      value: latest ? `${latest.nitrogen_kgha} kg/ha` : "--",
    },
    {
      icon: <FaFlask />,
      title: "Phosphorus",
      value: latest ? `${latest.phosphorus_kgha} kg/ha` : "--",
    },
    {
      icon: <FaFlask />,
      title: "Potassium",
      value: latest ? `${latest.potassium_kgha} kg/ha` : "--",
    },
    {
      icon: <FaFlask />,
      title: "Soil pH",
      value: latest ? latest.ph : "--",
    },
    {
      icon: <FaWater />,
      title: "Air Humidity",
      value: weather ? `${weather.humidity} %` : "--",
    },
    {
      icon: <FaCloudRain />,
      title: "Rain Probability",
      value: weather ? `${weather.rainProbability} %` : "--",
    },
    {
      icon: <FaLightbulb />,
      title: "Light Intensity",
      value: weather ? `${weather.lightIntensity} W/m²` : "--",
    },
  ];

  return (
    <div className="irrigation">
      <div className="pageHeader">
        <h1>Irrigation Control</h1>
        <p>Monitor live IoT sensor data and irrigation recommendation.</p>
      </div>

      <FieldSelector onChange={setFieldId} />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* LIVE SENSOR DATA (all sensors) */}
      <div className="sensorSection">
        <div className="sectionTitle">
          <h2>Live IoT Sensor Data</h2>
        </div>

        <div className="sensorGrid">
          {sensorData.map((sensor, index) => (
            <div className="sensorCard" key={index}>
              <div className="sensorIcon">{sensor.icon}</div>
              <div className="sensorContent">
                <h4>{sensor.title}</h4>
                <h2>{sensor.value}</h2>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI RECOMMENDATION (real — ML irrigation model) */}
      <div className="recommendationSection">
        <div className="sectionTitle">
          <h2>AI Irrigation Recommendation</h2>
        </div>

        <div className="recommendationCard">
          <FaSeedling className="sensorIcon" />
          {aiLoading && <p className="inlineNote">Analyzing sensor data...</p>}
          {aiError && <p className="inlineNote errorText">{aiError}</p>}
          {irrigation && (
            <>
              <h1 className="recommendText">
                {irrigation.pump === 1 ? "Irrigation Required" : "Irrigation Not Required"}
              </h1>
              <p className="confidenceText">
                Confidence: {(irrigation.confidence * 100).toFixed(1)}%
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Irrigation;
