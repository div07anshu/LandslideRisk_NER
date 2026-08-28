import joblib
import pandas as pd

MODEL_PATH = "app/models/landslide_risk_model.joblib"


artifact = joblib.load(MODEL_PATH)

model = artifact["model"]
features = artifact["features"]


def predict_risk(data: dict) -> dict:

    input_data = pd.DataFrame(
        [[data[feature] for feature in features]],
        columns=features,
    )

    probability = float(model.predict_proba(input_data)[0][1])

    risk_score = round(
        probability * 100,
        2,
    )

    if risk_score < 35:
        risk_level = "LOW"
    elif risk_score < 70:
        risk_level = "MODERATE"
    else:
        risk_level = "HIGH"

    return {
        "probability": round(
            probability,
            4,
        ),
        "risk_score": risk_score,
        "risk_level": risk_level,
    }
