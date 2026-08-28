import time
from datetime import timedelta

import pandas as pd
import requests

INPUT_FILE = "data/processed/ner_landslides_districts.csv"
OUTPUT_FILE = "data/processed/ner_landslides_weather.csv"
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


def get_historical_data(latitude, longitude, event_date) -> dict:

    event_date = pd.to_datetime(event_date)
    start_date = (event_date - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = (event_date - timedelta(days=1)).strftime("%Y-%m-%d")

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "precipitation,relative_humidity_2m,soil_moisture_0_to_7cm",
        "timezone": "auto",
    }

    response = requests.get(
        OPEN_METEO_ARCHIVE_URL,
        params=params,
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    precipitation = data["hourly"]["precipitation"]
    humidity = data["hourly"]["relative_humidity_2m"]
    soil_moisture = data["hourly"]["soil_moisture_0_to_7cm"]

    precipitation = [value for value in precipitation if value is not None]
    humidity = [value for value in humidity[-24:] if value is not None]
    soil_moisture = [value for value in soil_moisture if value is not None]

    if not precipitation:
        raise ValueError("No precipitation data returned")

    if not humidity:
        raise ValueError("No humidity data returned")

    if not soil_moisture:
        raise ValueError("No soil moisture data returned")

    rainfall_7d = sum(precipitation)
    rainfall_48h = sum(precipitation[-48:])
    rainfall_24h = sum(precipitation[-24:])

    return {
        "rainfall_7d": round(rainfall_7d, 2),
        "rainfall_48h": round(rainfall_48h, 2),
        "rainfall_24h": round(rainfall_24h, 2),
        "average_humidity_24h": round(
            sum(humidity) / len(humidity),
            2,
        ),
        "soil_moisture": round(soil_moisture[-1], 3),
    }


def enrich_dataset():
    df = pd.read_csv(INPUT_FILE)

    df = df.dropna(subset=["district"]).copy()
    print(f"Events to process: {len(df)}")

    weather_features = []

    for count, (index, row) in enumerate(df.iterrows(), start=1):
        print(f"Processing {count}/{len(df)} (event_id={row['event_id']})")

        try:
            features = get_historical_data(
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                event_date=row["event_date"],
            )

            weather_features.append(features)

        except Exception as error:  # noqa: BLE001
            print(f"  Failed: {error}")

            weather_features.append(
                {
                    "rainfall_24h": None,
                    "rainfall_48h": None,
                    "rainfall_7d": None,
                    "average_humidity_24h": None,
                    "soil_moisture": None,
                }
            )

            time.sleep(0.2)

    weather_df = pd.DataFrame(
        weather_features,
        index=df.index,
    )

    df = pd.concat(
        [
            df,
            weather_df,
        ],
        axis=1,
    )

    df["landslide"] = 1
    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print(f"Saved enriched dataset to: {OUTPUT_FILE}")

    print(f"Total rows: {len(df)}")

    print(
        "Rows with missing weather data:",
        df[
            [
                "rainfall_24h",
                "rainfall_48h",
                "rainfall_7d",
                "average_humidity_24h",
                "soil_moisture",
            ]
        ]
        .isna()
        .any(axis=1)
        .sum(),
    )


if __name__ == "__main__":
    enrich_dataset()
