from app.services.risk_service import analyze_location
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/api/risk",
    tags=["Risk"],
)


class LocationInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


@router.post("/analyze")
def analyze_risk(data: LocationInput):

    try:
        return analyze_location(
            latitude=data.latitude,
            longitude=data.longitude,
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Risk prediction failed: {error}",
        )
