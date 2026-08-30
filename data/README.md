# 📊 Data Processing Pipeline

This directory contains the landslide inventory, geographic boundaries, processing scripts, and machine learning model training workflow for the North-East India Landslide Risk Assessment System.

---

## 📁 Directory Structure

```
data/
├── raw/                   # Original unprocessed datasets
│   └── Global_Landslide_Catalog_Export_rows.csv
├── processed/             # Cleaned and enriched datasets
│   ├── ner_landslides.csv
│   ├── ner_landslides_districts.csv
│   ├── ner_landslides_weather.csv
│   ├── negative_samples.csv
│   ├── negative_samples_weather.csv
│   ├── landslide_training_data.csv
│   ├── landslide_training_data_elevation.csv
│   └── landslide_training_data_terrain.csv
├── boundaries/            # GeoJSON district boundaries
│   ├── india_districts.geojson
│   └── ner_districts.geojson
└── scripts/               # Data processing and ML training scripts
```

---

## 📥 Data Sources

### 1. **Global Landslide Catalog (NASA)**
- **File**: `raw/Global_Landslide_Catalog_Export_rows.csv`
- **Source**: [NASA's Global Landslide Catalog](https://data.nasa.gov/Earth-Science/Global-Landslide-Catalog-Export/dd9e-wu2v)
- **Description**: Historical landslide events worldwide with location, date, trigger, and size
- **Coverage**: Filtered to North-East India (Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Sikkim)

### 2. **Administrative Boundaries**
- **Files**: `boundaries/india_districts.geojson`, `boundaries/ner_districts.geojson`
- **Source**: Downloaded via `download_districts.py` (OpenStreetMap-derived)
- **Purpose**: Spatial joins to assign district labels to landslide events

### 3. **Weather Data**
- **Source**: [Open-Meteo Historical Weather API](https://open-meteo.com/)
- **Features**: Rainfall (24h, 48h, 7-day cumulative), humidity, soil moisture
- **Access**: Free, no API key required (rate limits apply)

### 4. **Elevation & Terrain**
- **Source**: [Open-Meteo Elevation API](https://open-meteo.com/en/docs/elevation-api)
- **Features**: Elevation (meters), slope (degrees)

---

## 🔄 Data Processing Pipeline

Run scripts in this order to reproduce the training dataset and model:

### **Phase 1: Data Cleaning & Geographic Enrichment**

#### 1. `clean_landslides.py`
```bash
python data/scripts/clean_landslides.py
```
- **Input**: `raw/Global_Landslide_Catalog_Export_rows.csv`
- **Output**: `processed/ner_landslides.csv`
- **Purpose**: Filters to India, standardizes NER state names, removes incomplete records

#### 2. `download_districts.py`
```bash
python data/scripts/download_districts.py
```
- **Output**: `boundaries/india_districts.geojson`, `boundaries/ner_districts.geojson`
- **Purpose**: Downloads district boundaries from OpenStreetMap for spatial joins

#### 3. `assign_districts.py`
```bash
python data/scripts/assign_districts.py
```
- **Input**: `processed/ner_landslides.csv`, `boundaries/ner_districts.geojson`
- **Output**: `processed/ner_landslides_districts.csv`
- **Purpose**: Spatial join to assign district names to each landslide event

#### 4. `check_unmatched.py` *(optional)*
```bash
python data/scripts/check_unmatched.py
```
- **Purpose**: Diagnostic script to identify landslide records that didn't match any district

---

### **Phase 2: Feature Engineering**

#### 5. `enrich_weather.py`
```bash
python data/scripts/enrich_weather.py
```
- **Input**: `processed/ner_landslides_districts.csv`
- **Output**: `processed/ner_landslides_weather.csv`
- **Purpose**: Fetches historical weather data (rainfall, humidity, soil moisture) for each landslide event from Open-Meteo API
- **Note**: Runs in batches with rate limiting to respect API usage policies

#### 6. `create_negative_samples.py`
```bash
python data/scripts/create_negative_samples.py
```
- **Input**: `processed/ner_landslides_weather.csv`
- **Output**: `processed/negative_samples.csv`
- **Purpose**: Generates synthetic "no-landslide" samples from the same geographic area and time periods to balance the training dataset

#### 7. `enrich_negative_weather.py`
```bash
python data/scripts/enrich_negative_weather.py
```
- **Input**: `processed/negative_samples.csv`
- **Output**: `processed/negative_samples_weather.csv`
- **Purpose**: Fetches weather data for negative samples

#### 8. `combine_datasets.py`
```bash
python data/scripts/combine_datasets.py
```
- **Input**: `processed/ner_landslides_weather.csv`, `processed/negative_samples_weather.csv`
- **Output**: `processed/landslide_training_data.csv`
- **Purpose**: Merges positive (landslide) and negative (no landslide) samples into a single labeled dataset with target column `landslide_occurred` (1 or 0)

#### 9. `add_elevation.py`
```bash
python data/scripts/add_elevation.py
```
- **Input**: `processed/landslide_training_data.csv`
- **Output**: `processed/landslide_training_data_elevation.csv`
- **Purpose**: Adds elevation (meters above sea level) for each sample via Open-Meteo Elevation API

#### 10. `add_slope.py`
```bash
python data/scripts/add_slope.py
```
- **Input**: `processed/landslide_training_data_elevation.csv`
- **Output**: `processed/landslide_training_data_terrain.csv`
- **Purpose**: Calculates slope (degrees) from nearby elevation samples using gradient approximation

---

### **Phase 3: Model Training**

#### 11. `train_model.py`
```bash
python data/scripts/train_model.py
```
- **Input**: `processed/landslide_training_data_terrain.csv`
- **Output**: `ai_services/app/models/landslide_risk_model.joblib`
- **Purpose**: Trains a machine learning classifier (Random Forest / Gradient Boosting / Extra Trees) on the enriched dataset
- **Features Used**:
  - `rainfall_24h`, `rainfall_48h`, `rainfall_7d`
  - `average_humidity_24h`
  - `soil_moisture`
  - `elevation`
  - `slope`
- **Target**: `landslide_occurred` (binary: 1 = landslide, 0 = no landslide)
- **Evaluation**: Prints accuracy, precision, recall, F1-score, ROC-AUC, confusion matrix, and cross-validation scores

---

## 🧪 Running the Full Pipeline

To regenerate all processed data and retrain the model from scratch:

```bash
# Ensure you're in the project root with venv activated
source venv/Scripts/activate  # Windows Git Bash
# source venv/bin/activate    # Linux/macOS

# Run all scripts in order
python data/scripts/clean_landslides.py
python data/scripts/download_districts.py
python data/scripts/assign_districts.py
python data/scripts/enrich_weather.py
python data/scripts/create_negative_samples.py
python data/scripts/enrich_negative_weather.py
python data/scripts/combine_datasets.py
python data/scripts/add_elevation.py
python data/scripts/add_slope.py
python data/scripts/train_model.py
```

**Warning**: Weather enrichment scripts make hundreds of API calls and may take 10-30 minutes depending on dataset size and rate limits.

---

## 📊 Dataset Statistics

| File | Description | Approximate Rows |
| :--- | :--- | ---: |
| `ner_landslides.csv` | Cleaned NER landslides | ~500-800 |
| `ner_landslides_weather.csv` | With weather features | ~400-700 |
| `negative_samples_weather.csv` | Synthetic non-landslides | ~400-700 |
| `landslide_training_data_terrain.csv` | Final training set | ~800-1400 |

---

## 🔍 Key Features in Training Data

| Feature | Type | Unit | Source |
| :--- | :--- | :--- | :--- |
| `rainfall_24h` | float | mm | Open-Meteo |
| `rainfall_48h` | float | mm | Open-Meteo |
| `rainfall_7d` | float | mm | Open-Meteo |
| `average_humidity_24h` | float | % | Open-Meteo |
| `soil_moisture` | float | m³/m³ | Open-Meteo |
| `elevation` | float | meters | Open-Meteo Elevation API |
| `slope` | float | degrees | Calculated from elevation gradient |
| `landslide_occurred` | int | 0 or 1 | Target variable |

---

## 🛠️ Dependencies

All Python dependencies are listed in the root `requirements.txt`:
- `pandas` — data manipulation
- `geopandas` — spatial operations
- `shapely` — geometry handling
- `requests` — API calls
- `scikit-learn` — model training
- `joblib` — model serialization
- `numpy` — numerical operations

---

## 📝 Notes

- **API Rate Limits**: Open-Meteo allows ~10,000 requests/day on the free tier. Weather enrichment scripts include delays to avoid hitting limits.
- **Data Quality**: Some landslide records lack precise coordinates or dates; these are filtered out during cleaning.
- **Negative Sampling Strategy**: Synthetic negatives are sampled from the same regions and seasons as positive samples to avoid distribution bias.
- **Model Selection**: `train_model.py` compares Random Forest, Gradient Boosting, and Extra Trees; the best-performing model is saved.

---

## 🚀 Next Steps

- Add more features (land use, vegetation index, seismic activity)
- Expand dataset to other landslide-prone regions
- Implement real-time data ingestion pipeline
- Set up automated retraining on new data
