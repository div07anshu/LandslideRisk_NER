import joblib
import pandas as pd

MODEL_PATH = "app/models/landslide_risk_model.joblib"

# Default LOW/MODERATE boundary thresholds. The Node backend keeps its own
# admin-configurable copy of these (backend/src/services/riskConfigService.ts)
# and re-derives risk_level itself for anything it persists/serves, so these
# defaults only matter for calls that don't pass their own thresholds (e.g.
# a direct/manual call to this service).
DEFAULT_LOW_MAX = 35
DEFAULT_MODERATE_MAX = 70


artifact = joblib.load(MODEL_PATH)

model = artifact["model"]
features = artifact["features"]


def predict_risk(
    data: dict,
    low_max: float = DEFAULT_LOW_MAX,
    moderate_max: float = DEFAULT_MODERATE_MAX,
) -> dict:

    input_data = pd.DataFrame(
        [[data[feature] for feature in features]],
        columns=features,
    )

    probability = float(model.predict_proba(input_data)[0][1])

    risk_score = round(
        probability * 100,
        2,
    )

    if risk_score < low_max:
        risk_level = "LOW"
    elif risk_score < moderate_max:
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
