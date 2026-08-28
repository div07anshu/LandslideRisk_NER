import time
from datetime import timedelta

import pandas as pd
import requests

INPUT_FILE = "data/processed/negative_samples.csv"
OUTPUT_FILE = "data/processed/negative_samples_weather.csv"

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


def get_historical_weather(
    latitude,
    longitude,
    event_date,
) -> dict:

    event_date = pd.to_datetime(event_date)

    start_date = (event_date - timedelta(days=7)).strftime("%Y-%m-%d")

    end_date = (event_date - timedelta(days=1)).strftime("%Y-%m-%d")

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
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

    if not precipitation:
        raise ValueError("No precipitation data returned")

    if not humidity:
        raise ValueError("No humidity data returned")

    if not soil_moisture:
        raise ValueError("No soil moisture data returned")

    return {
        "rainfall_24h": round(
            sum(precipitation[-24:]),
            2,
        ),
        "rainfall_48h": round(
            sum(precipitation[-48:]),
            2,
        ),
        "rainfall_7d": round(
            sum(precipitation),
            2,
        ),
        "average_humidity_24h": round(
            sum(humidity[-24:]) / len(humidity[-24:]),
            2,
        ),
        "soil_moisture": round(
            soil_moisture[-1],
            3,
        ),
    }


def enrich_negative_samples():
    df = pd.read_csv(INPUT_FILE)
    df["landslide"] = 0
    print(f"Negative samples to process: {len(df)}")

    weather_features = []

    for position, (_, row) in enumerate(df.iterrows(), start=1):
        print(f"Processing {position}/{len(df)} (event_id={row['event_id']})")

        try:
            features = get_historical_weather(
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                event_date=row["event_date"],
            )

        except Exception as error:  # noqa: BLE001
            print(f"  Failed: {error}")

            features = {
                "rainfall_24h": None,
                "rainfall_48h": None,
                "rainfall_7d": None,
                "average_humidity_24h": None,
                "soil_moisture": None,
            }

        weather_features.append(features)

        # Small delay between requests.
        time.sleep(0.2)

    weather_df = pd.DataFrame(
        weather_features,
        index=df.index,
    )

    df = pd.concat(
        [df, weather_df],
        axis=1,
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print(f"Saved: {OUTPUT_FILE}")

    print(f"Total rows: {len(df)}")

    weather_columns = [
        "rainfall_24h",
        "rainfall_48h",
        "rainfall_7d",
        "average_humidity_24h",
        "soil_moisture",
    ]

    print(
        "Rows with missing weather data:",
        df[weather_columns].isna().any(axis=1).sum(),
    )


if __name__ == "__main__":
    enrich_negative_samples()
