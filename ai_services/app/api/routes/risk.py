from app.services.district_risk_service import calculate_all_district_risks
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

    except Exception as error:  # noqa: BLE001
        print(f"[risk] Error analyzing " f"{data.latitude}, {data.longitude}: {error}")

        raise HTTPException(
            status_code=500,
            detail=(
                "Risk analysis service is currently unavailable. "
                "Please try again later."
            ),
        )


@router.get("/districts")
def analyze_all_districts():
    try:
        districts = calculate_all_district_risks()

        return {
            "district_count": len(districts),
            "districts": districts,
        }

    except Exception as error:  # noqa: BLE001
        print(f"[risk] District analysis error: {error}")

        raise HTTPException(
            status_code=500,
            detail=("District risk analysis service is " "currently unavailable."),
        )
