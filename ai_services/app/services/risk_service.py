def calculate_risk(
    rainfall_24h: float,
    rainfall_7d: float,
    soil_moisture: float,
    slope: float,
    elevation: float,
    historical_landslides: int,
 ) -> dict:

    
    rainfall_score = calculate_rainfall_score(rainfall_24h, rainfall_7d)
    soil_score = calculate_soil_score(soil_moisture)
    slope_score = calculate_slope_score(slope)
    elevation_score = calculate_elevation_score(elevation)
    historical_score = calculate_historical_score(historical_landslides)

    risk_score = (
        rainfall_score * 0.30
        + soil_score * 0.20
        + slope_score * 0.25
        + elevation_score * 0.10
        + historical_score * 0.15
    )

    risk_score = round(min(max(risk_score, 0), 100), 2)

    return {
        "risk_score": risk_score,
        "risk_level": get_risk_level(risk_score),
    }


def calculate_rainfall_score(
    rainfall_24h: float,
    rainfall_7d: float,
) -> float:

    recent_score = min((rainfall_24h / 200) * 100, 100)
    weekly_score = min((rainfall_7d / 500) * 100, 100)

    return recent_score * 0.6 + weekly_score * 0.4


def calculate_soil_score(soil_moisture: float) -> float:
    """
    soil_moisture expected roughly between 0 and 1.
    """

    return min(max(soil_moisture * 100, 0), 100)


def calculate_slope_score(slope: float) -> float:
    """
    Higher slope generally means greater susceptibility.
    """

    return min((slope / 60) * 100, 100)


def calculate_elevation_score(elevation: float) -> float:
    """
    Temporary placeholder.
    """

    return min((elevation / 3000) * 100, 100)


def calculate_historical_score(historical_landslides: int) -> float:
    """
    Convert historical landslide count into a 0-100 score.
    """

    return min(historical_landslides * 10, 100)


def get_risk_level(score: float) -> str:
    if score < 35:
        return "LOW"

    if score < 70:
        return "MODERATE"

    return "HIGH"