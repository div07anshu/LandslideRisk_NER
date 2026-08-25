from app.services.risk_service import calculate_risk
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/api/risk" ,
    tags=["Risk"],
)

class RiskInput(BaseModel):
    rainfall_24h : float = Field(...,ge=0)
    rainfall_7d : float = Field(...,ge=0)
    soil_moisture:float =Field(...,ge=0,le=1)
    slope:float=Field(...,ge=0)
    elevation: float = Field(..., ge=0)
    historical_landslides: int = Field(..., ge=0)


@router.post("/analyze")
def analyze_risk(data: RiskInput):
    try:
        result = calculate_risk(
            rainfall_24h=data.rainfall_24h,
            rainfall_7d=data.rainfall_7d,
            soil_moisture=data.soil_moisture,
            slope=data.slope,
            elevation=data.elevation,
            historical_landslides=data.historical_landslides,
        )

        return result

    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Risk calculation failed: {e!s}"
        )

