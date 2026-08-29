import math

import requests
from app.services.prediction_service import predict_risk
from app.services.weather_service import extract_weather_features

ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"

OFFSET_DEGREES = 0.001


def get_elevation(
    latitude: float,
    longitude: float,
) -> float:
    response = requests.get(
        ELEVATION_URL,
        params={
            "latitude": latitude,
            "longitude": longitude,
        },
        timeout=30,
    )

    response.raise_for_status()

    return float(response.json()["elevation"][0])


def calculate_live_slope(
    latitude: float,
    longitude: float,
) -> float:

    lat = float(latitude)
    lon = float(longitude)

    north_lat = lat + OFFSET_DEGREES
    south_lat = lat - OFFSET_DEGREES
    east_lon = lon + OFFSET_DEGREES
    west_lon = lon - OFFSET_DEGREES

    lats = [
        north_lat,
        south_lat,
        lat,
        lat,
    ]

    lons = [
        lon,
        lon,
        east_lon,
        west_lon,
    ]

    response = requests.get(
        ELEVATION_URL,
        params={
            "latitude": ",".join(map(str, lats)),
            "longitude": ",".join(map(str, lons)),
        },
        timeout=30,
    )

    response.raise_for_status()

    elevations = response.json()["elevation"]

    north_elev = elevations[0]
    south_elev = elevations[1]
    east_elev = elevations[2]
    west_elev = elevations[3]

    metres_per_lat = 111320

    metres_per_lon = 111320 * math.cos(math.radians(lat))

    dz_dy = (north_elev - south_elev) / (2 * OFFSET_DEGREES * metres_per_lat)

    dz_dx = (east_elev - west_elev) / (2 * OFFSET_DEGREES * metres_per_lon)

    gradient = math.sqrt(dz_dx**2 + dz_dy**2)

    slope_radians = math.atan(gradient)

    return round(
        math.degrees(slope_radians),
        2,
    )


def analyze_location(
    latitude: float,
    longitude: float,
) -> dict:

    weather = extract_weather_features(
        latitude=latitude,
        longitude=longitude,
    )

    elevation = get_elevation(
        latitude,
        longitude,
    )

    slope = calculate_live_slope(
        latitude,
        longitude,
    )

    features = {
        "rainfall_24h": weather["rainfall_24h"],
        "rainfall_48h": weather["rainfall_48h"],
        "rainfall_7d": weather["rainfall_7d"],
        "average_humidity_24h": weather["average_humidity_24h"],
        "soil_moisture": weather["soil_moisture"],
        "elevation": elevation,
        "slope": slope,
    }

    prediction = predict_risk(features)

    return {
        "probability": prediction["probability"],
        "risk_score": prediction["risk_score"],
        "risk_level": prediction["risk_level"],
        "features": features,
    }
