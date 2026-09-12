from app.services.risk_service import analyze_location
from app.services.cache_service import (
    get_cached_risk,
    set_cached_risk,
    get_all_cached_districts,
    get_cache_stats,
    clear_expired_cache
)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/api/risk",
    tags=["Risk"],
)


class LocationInput(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class DistrictInput(BaseModel):
    district_name: str = Field(..., min_length=1)
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
        # Log the actual error server-side for debugging
        print(f"[risk] Error analyzing {data.latitude}, {data.longitude}: {error}")
        raise HTTPException(
            status_code=500,
            detail="Risk analysis service is currently unavailable. Please try again later.",
        )


@router.post("/district")
def analyze_district_risk(data: DistrictInput):
    """
    Analyze landslide risk for a district using its centroid coordinates.
    Returns real-time predictions with all weather and terrain features.
    Uses 3-hour cache to avoid redundant API calls.
    """
    # Check cache first
    cached = get_cached_risk(data.district_name)
    if cached:
        print(f"[cache] Using cached data for {data.district_name}")
        return cached

    # Cache miss - fetch fresh data
    try:
        result = analyze_location(
            latitude=data.latitude,
            longitude=data.longitude,
        )

        # Add district name to the response
        result["district_name"] = data.district_name

        # Cache the result
        set_cached_risk(data.district_name, result)

        return result

    except Exception as error:
        print(f"[risk] Error analyzing district {data.district_name}: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"Could not analyze risk for {data.district_name}. Weather data may be temporarily unavailable.",
        )


@router.get("/cache/all")
def get_all_cached():
    """
    Get all cached district risk scores.
    Frontend can use this to populate the map instantly.
    """
    return get_all_cached_districts()


@router.get("/cache/stats")
def get_stats():
    """
    Get cache statistics.
    """
    return get_cache_stats()


@router.post("/cache/clear-expired")
def clear_expired():
    """
    Manually clear expired cache entries.
    """
    clear_expired_cache()
    return {"status": "ok", "message": "Expired cache entries cleared"}
