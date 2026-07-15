import { useState, useEffect, useRef } from "react";
import "./css/FarmMonitoring.css";

import {
  FaTint,
  FaTemperatureHigh,
  FaWater,
  FaCloudRain,
  FaFlask,
  FaLightbulb,
  FaBug,
  FaCamera,
  FaLeaf,
  FaCheckCircle,
  FaSeedling,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  getLatestSensorReading,
  getSensorHistory,
  getWeather,
  getCrop,
  predictFertilizer,
  predictDisease,
} from "../../api/farmerService";
import FieldSelector from "../../components/common/FieldSelector";

function FarmMonitoring() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [weather, setWeather] = useState(null);
  const [crop, setCrop] = useState(null);
  const [error, setError] = useState("");

  const [fertilizer, setFertilizer] = useState(null);
  const [fertLoading, setFertLoading] = useState(false);
  const [fertError, setFertError] = useState("");

  // Disease detection — image is only kept in browser memory (as a local
  // object URL for preview) and sent to the backend for prediction; it is
  // never persisted anywhere.
  const [diseaseImage, setDiseaseImage] = useState(null); // File
  const [diseasePreviewUrl, setDiseasePreviewUrl] = useState(null);
  const [diseaseResult, setDiseaseResult] = useState(null);
  const [diseaseLoading, setDiseaseLoading] = useState(false);
  const [diseaseError, setDiseaseError] = useState("");
  const fileInputRef = useRef(null);

  // Only meaningful once the farmer has more than one field — see
  // FieldSelector, which stays hidden (and this stays null) otherwise.
  const [fieldId, setFieldId] = useState(null);

  const loadSensorData = async (selectedFieldId) => {
    try {
      const [latestRes, historyRes, cropRes] = await Promise.all([
        getLatestSensorReading(selectedFieldId),
        getSensorHistory(selectedFieldId),
        getCrop(selectedFieldId),
      ]);
      setLatest(latestRes.data.data);
      setHistory(historyRes.data.data);
      setCrop(cropRes.data.data);
    } catch (err) {
      setError("Failed to load sensor data");
      console.error(err);
    }
  };

  useEffect(() => {
    (async () => {
      await loadSensorData(null);

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

  // Refetch scoped sensor/crop data whenever the farmer picks a different field.
  useEffect(() => {
    if (fieldId === null) return;
    loadSensorData(fieldId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId]);

  // AI Fertilizer Recommendation — takes all sensor data (N/P/K/ph/soil
  // type/moisture/temperature from the latest reading) plus live rainfall
  // from the weather feed, and asks the ML service for a recommendation.
  useEffect(() => {
    if (!latest || !weather) return;
    (async () => {
      try {
        setFertLoading(true);
        setFertError("");
        const res = await predictFertilizer({ rainfall: weather.rainfall }, fieldId);
        setFertilizer(res.data.data);
      } catch (err) {
        setFertError("Failed to get fertilizer recommendation");
        console.error(err);
      } finally {
        setFertLoading(false);
      }
    })();
  }, [latest, weather, fieldId]);

  // Revoke the object URL when it changes/unmounts to avoid leaking memory.
  useEffect(() => {
    return () => {
      if (diseasePreviewUrl) URL.revokeObjectURL(diseasePreviewUrl);
    };
  }, [diseasePreviewUrl]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setDiseaseError("Please upload a JPG or PNG image.");
      return;
    }

    setDiseaseError("");
    setDiseaseResult(null);
    if (diseasePreviewUrl) URL.revokeObjectURL(diseasePreviewUrl);
    setDiseaseImage(file);
    setDiseasePreviewUrl(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    if (diseasePreviewUrl) URL.revokeObjectURL(diseasePreviewUrl);
    setDiseaseImage(null);
    setDiseasePreviewUrl(null);
    setDiseaseResult(null);
    setDiseaseError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDetectDisease = async () => {
    if (!diseaseImage) return;
    try {
      setDiseaseLoading(true);
      setDiseaseError("");
      const res = await predictDisease(diseaseImage);
      setDiseaseResult(res.data.data);
    } catch (err) {
      setDiseaseError(
        err?.response?.data?.message ||
          "Failed to analyze image. Please try again."
      );
      console.error(err);
    } finally {
      setDiseaseLoading(false);
    }
  };

  // All sensors data — combining fields from both ML datasets
  const sensors = [
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
      icon: <FaLeaf />,
      title: "Soil Type",
      value: latest ? latest.soil_type : "--",
    },
    {
      icon: <FaWater />,
      title: "Humidity",
      value: weather ? `${weather.humidity} %` : "--",
    },
    {
      icon: <FaCloudRain />,
      title: "Rain Probability",
      value: weather ? `${weather.rainProbability} %` : "--",
    },
    {
      icon: <FaCloudRain />,
      title: "Rainfall",
      value: weather ? `${weather.rainfall} mm` : "--",
    },
    {
      icon: <FaLightbulb />,
      title: "Light Intensity",
      value: weather ? `${weather.lightIntensity} W/m²` : "--",
    },
  ];

  // Reshape history rows into recharts-friendly format (now including ph)
  const graphData = history.map((row) => ({
    time: new Date(row.recorded_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    moisture: row.soil_moisture_percent,
    temperature: row.soil_temperature_celsius,
    nitrogen: row.nitrogen_kgha,
    phosphorus: row.phosphorus_kgha,
    potassium: row.potassium_kgha,
    ph: row.ph,
  }));

  return (
    <div className="farmMonitoring">
      <div className="pageHeader">
        <h1>Farm Monitoring</h1>
        <p>Monitor live IoT sensor data and AI crop health analysis.</p>
      </div>

      <FieldSelector onChange={setFieldId} />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* SENSOR CARDS (real data — all sensors) */}
      <div className="sensorGrid">
        {sensors.map((sensor, index) => (
          <div className="sensorCard" key={index}>
            <div className="sensorIcon">{sensor.icon}</div>
            <div>
              <h4>{sensor.title}</h4>
              <h2>{sensor.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* DISEASE DETECTION (real — image is sent to the ML service for
          prediction and is never saved on the backend) */}
      <div className="diseaseSection">
        <div className="sectionTitle">
          <FaBug />
          <h2>Disease Detection (AI)</h2>
        </div>

        <div className="diseaseContainer">
          <div className="imageCard">
            {diseasePreviewUrl ? (
              <div className="imagePreviewWrap">
                <img
                  src={diseasePreviewUrl}
                  alt="Rice leaf preview"
                  className="imagePreview"
                />
                <button
                  type="button"
                  className="clearImageBtn"
                  onClick={handleClearImage}
                  title="Remove image"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <label className="imagePlaceholder" htmlFor="diseaseImageInput">
                <FaCamera />
                <p>Upload Rice Leaf Image</p>
              </label>
            )}

            <input
              id="diseaseImageInput"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />

            <div className="diseaseActions">
              <label htmlFor="diseaseImageInput" className="chooseImageBtn">
                <FaCamera /> {diseaseImage ? "Change Image" : "Choose Image"}
              </label>
              <button
                type="button"
                className="analyzeBtn"
                onClick={handleDetectDisease}
                disabled={!diseaseImage || diseaseLoading}
              >
                {diseaseLoading ? (
                  <>
                    <FaSpinner className="spinIcon" /> Analyzing...
                  </>
                ) : (
                  "Analyze Image"
                )}
              </button>
            </div>

            {diseaseError && (
              <p className="inlineNote errorText">
                <FaExclamationTriangle /> {diseaseError}
              </p>
            )}
          </div>

          <div className="resultCard">
            <h3>
              <FaLeaf />
              Prediction Result
            </h3>
            {!diseaseResult && !diseaseLoading && (
              <p className="inlineNote">
                Upload a rice leaf image and click "Analyze Image" to get a prediction.
              </p>
            )}
            {diseaseLoading && <p className="inlineNote">Analyzing image...</p>}
            {diseaseResult && (
              <table>
                <tbody>
                  <tr><td>Disease</td><td>{diseaseResult.disease}</td></tr>
                  <tr><td>Confidence</td><td>{(diseaseResult.confidence * 100).toFixed(2)}%</td></tr>
                  <tr><td>Severity</td><td>{diseaseResult.severity}</td></tr>
                  <tr>
                    <td>Affected Area</td>
                    <td>
                      {diseaseResult.affectedAreaPercent !== null &&
                      diseaseResult.affectedAreaPercent !== undefined
                        ? `${diseaseResult.affectedAreaPercent}%`
                        : "--"}
                    </td>
                  </tr>
                  <tr>
                    <td>Status</td>
                    <td className={diseaseResult.status === "Healthy" ? "healthy" : "diseased"}>
                      <FaCheckCircle />
                      {diseaseResult.status}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="recommendationCard">
            <h3>Treatment Recommendation</h3>
            {diseaseResult ? (
              <ul>
                {(diseaseResult.recommendations || []).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            ) : (
              <p className="inlineNote">Recommendations will appear here after analysis.</p>
            )}
          </div>
        </div>
      </div>

      {/* FERTILIZER RECOMMENDATION (real — driven by all sensor data + ML) */}
      <div className="fertilizerSection">
        <div className="sectionTitle">
          <FaSeedling />
          <h2>AI Fertilizer Recommendation</h2>
        </div>

        <div className="fertilizerContainer">
          <div className="fertilizerCard">
            <h3>Current Soil Information</h3>
            <table>
              <tbody>
                <tr><td>Crop</td><td>{crop?.crop_name || "--"}</td></tr>
                <tr><td>Soil Type</td><td>{latest?.soil_type || "--"}</td></tr>
                <tr><td>Nitrogen (N)</td><td>{latest ? `${latest.nitrogen_kgha} kg/ha` : "--"}</td></tr>
                <tr><td>Phosphorus (P)</td><td>{latest ? `${latest.phosphorus_kgha} kg/ha` : "--"}</td></tr>
                <tr><td>Potassium (K)</td><td>{latest ? `${latest.potassium_kgha} kg/ha` : "--"}</td></tr>
                <tr><td>pH</td><td>{latest ? latest.ph : "--"}</td></tr>
                <tr><td>Moisture</td><td>{latest ? `${latest.soil_moisture_percent}%` : "--"}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="fertilizerCard">
            <h3>Recommended Fertilizer</h3>
            {fertLoading && <p className="inlineNote">Analyzing sensor data...</p>}
            {fertError && <p className="inlineNote errorText">{fertError}</p>}
            {fertilizer && (
              <div className="recommendBox">
                <h1>{fertilizer.fertilizer}</h1>
                <p>{fertilizer.remark}</p>
                <p className="confidenceText">
                  Confidence: {(fertilizer.confidence * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          <div className="fertilizerCard">
            <h3>Application Advice</h3>
            <ul className="tips">
              <li>Apply fertilizer early morning.</li>
              <li>Do not irrigate immediately after application.</li>
              <li>Split nitrogen application into two stages.</li>
              <li>Re-check recommendation after updating sensor readings.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SENSOR GRAPH (real history, now with N/P/K and pH) */}
      <div className="graphSection">
        <div className="sectionTitle">
          <h2>Sensor History</h2>
        </div>

        <div className="graphCard">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 14]} />
              <Tooltip />
              <Legend />

              <Line yAxisId="left" type="monotone" dataKey="moisture" stroke="#2E7D32" strokeWidth={3} name="Soil Moisture (%)" />
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#FF9800" strokeWidth={3} name="Soil Temperature (°C)" />
              <Line yAxisId="left" type="monotone" dataKey="nitrogen" stroke="#1976D2" strokeWidth={2} name="Nitrogen (kg/ha)" />
              <Line yAxisId="left" type="monotone" dataKey="phosphorus" stroke="#8E24AA" strokeWidth={2} name="Phosphorus (kg/ha)" />
              <Line yAxisId="left" type="monotone" dataKey="potassium" stroke="#D32F2F" strokeWidth={2} name="Potassium (kg/ha)" />
              <Line yAxisId="right" type="monotone" dataKey="ph" stroke="#6D4C41" strokeWidth={2} name="Soil pH" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default FarmMonitoring;