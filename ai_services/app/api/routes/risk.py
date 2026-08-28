from app.services.prediction_service import predict_risk
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/api/risk",
    tags=["Risk"],
)


class RiskInput(BaseModel):
    rainfall_24h: float = Field(..., ge=0)
    rainfall_48h: float = Field(..., ge=0)
    rainfall_7d: float = Field(..., ge=0)
    average_humidity_24h: float = Field(..., ge=0, le=100)
    soil_moisture: float = Field(..., ge=0, le=1)
    elevation: float = Field(..., ge=0)
    slope: float = Field(..., ge=0, le=90)


@router.post("/analyze")
def analyze_risk(data: RiskInput):

    try:
        return predict_risk(data.model_dump())

    except Exception as error:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Risk prediction failed: {error}",
        )
