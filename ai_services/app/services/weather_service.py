from datetime import datetime, timedelta

import requests

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


def extract_weather_features(
    latitude: float,
    longitude: float,
) -> dict:
    """
    Get weather features required by the trained
    landslide model for a location.
    """

    # Last complete day
    end_date = datetime.now().date() - timedelta(days=1)  # noqa: DTZ005

    # Seven days before that
    start_date = end_date - timedelta(days=6)

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "hourly": ("precipitation,relative_humidity_2m,soil_moisture_0_to_7cm"),
        "timezone": "auto",
    }

    response = requests.get(
        OPEN_METEO_ARCHIVE_URL,
        params=params,
        timeout=30,
    )

    response.raise_for_status()

    hourly = response.json()["hourly"]

    precipitation = [value for value in hourly["precipitation"] if value is not None]

    humidity = [value for value in hourly["relative_humidity_2m"] if value is not None]

    soil_moisture = [
        value for value in hourly["soil_moisture_0_to_7cm"] if value is not None
    ]

    if len(precipitation) < 168:
        raise ValueError("Not enough historical precipitation data")

    if len(humidity) < 24:
        raise ValueError("Not enough humidity data")

    if not soil_moisture:
        raise ValueError("No soil moisture data")

    # Last 24 hours
    rainfall_24h = sum(precipitation[-24:])

    # Last 48 hours
    rainfall_48h = sum(precipitation[-48:])

    # Last 7 days = 168 hours
    rainfall_7d = sum(precipitation[-168:])

    # Average humidity during last 24 hours
    average_humidity_24h = sum(humidity[-24:]) / len(humidity[-24:])

    # Latest available soil moisture
    latest_soil_moisture = soil_moisture[-1]

    return {
        "rainfall_24h": round(
            rainfall_24h,
            2,
        ),
        "rainfall_48h": round(
            rainfall_48h,
            2,
        ),
        "rainfall_7d": round(
            rainfall_7d,
            2,
        ),
        "average_humidity_24h": round(
            average_humidity_24h,
            2,
        ),
        "soil_moisture": round(
            latest_soil_moisture,
            3,
        ),
    }
