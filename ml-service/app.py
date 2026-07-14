"""
ML microservice: fertilizer (all crops, WITH PH) + irrigation (WITHOUT fieldworks).
Run:  python app.py
Listens on http://localhost:5001
"""
from flask import Flask, request, jsonify
import joblib
import pandas as pd
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

fert_model = joblib.load(os.path.join(BASE_DIR, 'fertilizer_model.pkl'))
fert_le = joblib.load(os.path.join(BASE_DIR, 'fertilizer_label_encoder.pkl'))
fert_remarks = json.load(open(os.path.join(BASE_DIR, 'fertilizer_remarks.json')))
fert_options = json.load(open(os.path.join(BASE_DIR, 'fertilizer_options.json')))
irrigation_model = joblib.load(os.path.join(BASE_DIR, 'irrigation_model.pkl'))

# PH included for fertilizer, fieldworks excluded for irrigation
REQUIRED_FERT_FIELDS = ['temperature', 'moisture', 'rainfall', 'ph', 'nitrogen',
                         'phosphorous', 'potassium', 'soil', 'crop']
REQUIRED_IRRIGATION_FIELDS = ['soil', 'temp', 'humidity', 'lightIntensity']


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/fertilizer-options', methods=['GET'])
def fertilizer_options():
    return jsonify(fert_options)


@app.route('/predict-fertilizer', methods=['POST'])
def predict_fertilizer():
    data = request.get_json(force=True) or {}
    missing = [f for f in REQUIRED_FERT_FIELDS if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    try:
        row = pd.DataFrame([{
            'Temperature': float(data['temperature']),
            'Moisture': float(data['moisture']),
            'Rainfall': float(data['rainfall']),
            'PH': float(data['ph']),
            'Nitrogen': float(data['nitrogen']),
            'Phosphorous': float(data['phosphorous']),
            'Potassium': float(data['potassium']),
            'Soil': str(data['soil']),
            'Crop': str(data['crop']).lower(),
        }])
        pred = fert_model.predict(row)[0]
        label = fert_le.inverse_transform([pred])[0]
        proba = fert_model.predict_proba(row)[0]
        confidence = round(float(max(proba)), 4)
        return jsonify({
            'fertilizer': label,
            'remark': fert_remarks.get(label, ''),
            'confidence': confidence
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict-irrigation', methods=['POST'])
def predict_irrigation():
    data = request.get_json(force=True) or {}
    missing = [f for f in REQUIRED_IRRIGATION_FIELDS if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    try:
        row = pd.DataFrame([{
            'Soil': float(data['soil']),
            'Temp': float(data['temp']),
            'Humi': float(data['humidity']),
            'Light Intensity': float(data['lightIntensity']),
        }])
        pred = int(irrigation_model.predict(row)[0])
        proba = irrigation_model.predict_proba(row)[0]
        confidence = round(float(max(proba)), 4)
        return jsonify({'pump': pred, 'confidence': confidence})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)