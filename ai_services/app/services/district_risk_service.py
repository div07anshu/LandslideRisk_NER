from __future__ import annotations

import json
import math
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import pandas as pd
import requests

from app.services.prediction_service import predict_risk

WEATHER_URL = "https://archive-api.open-meteo.com/v1/archive"
ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"

BATCH_SIZE = 15
MAX_WORKERS = 4

REQUEST_TIMEOUT = 30
REQUEST_RETRIES = 3
RETRY_DELAY_SECONDS = 2

OFFSET_DEGREES = 0.001

DATA_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "ner_district_6_points.geojson"
)


def _request_json(
    url: str,
    params: dict[str, Any],
) -> Any:
    last_error: Exception | None = None

    for attempt in range(REQUEST_RETRIES):
        try:
            response = requests.get(
                url,
                params=params,
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()
            return response.json()

        except requests.RequestException as error:
            last_error = error

            if attempt < REQUEST_RETRIES - 1:
                time.sleep(RETRY_DELAY_SECONDS * (attempt + 1))

    raise RuntimeError(
        f"Request failed after {REQUEST_RETRIES} attempts: " f"{url} - {last_error}"
    )


def _load_points() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"District point dataset not found: {DATA_PATH}")

    with DATA_PATH.open("r", encoding="utf-8") as file:
        geojson = json.load(file)

    records: list[dict[str, Any]] = []

    for feature in geojson.get("features", []):
        properties = feature.get("properties")

        if properties:
            records.append(properties)

    if not records:
        raise ValueError("No district points found in GeoJSON dataset")

    df = pd.DataFrame(records)

    required_columns = {
        "district_id",
        "district_name",
        "state_name",
        "point_number",
        "latitude",
        "longitude",
    }

    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(
            "District point dataset is missing columns: " f"{sorted(missing)}"
        )

    df["district_id"] = df["district_id"].astype(int)
    df["point_number"] = df["point_number"].astype(int)
    df["latitude"] = df["latitude"].astype(float)
    df["longitude"] = df["longitude"].astype(float)

    return df


def _chunks(
    df: pd.DataFrame,
    size: int,
):
    for start in range(0, len(df), size):
        yield df.iloc[start : start + size].copy()


def _normalise_location_response(
    response: Any,
    expected_count: int,
) -> list[dict[str, Any]]:
    if isinstance(response, list):
        locations = response
    elif isinstance(response, dict):
        locations = [response]
    else:
        raise ValueError("Unexpected Open-Meteo response format")

    if len(locations) != expected_count:
        raise ValueError(
            "Open-Meteo returned "
            f"{len(locations)} locations; expected "
            f"{expected_count}"
        )

    return locations


def _extract_weather_features(
    response: dict[str, Any],
) -> dict[str, float]:
    hourly = response.get("hourly")

    if not hourly:
        raise ValueError("Weather response does not contain hourly data")

    precipitation = [
        value for value in hourly.get("precipitation", []) if value is not None
    ]

    humidity = [
        value for value in hourly.get("relative_humidity_2m", []) if value is not None
    ]

    soil_moisture = [
        value for value in hourly.get("soil_moisture_0_to_7cm", []) if value is not None
    ]

    if len(precipitation) < 168:
        raise ValueError("Not enough historical precipitation data")

    if len(humidity) < 24:
        raise ValueError("Not enough humidity data")

    if not soil_moisture:
        raise ValueError("No soil moisture data")

    rainfall_24h = sum(precipitation[-24:])

    rainfall_48h = sum(precipitation[-48:])

    rainfall_7d = sum(precipitation[-168:])

    average_humidity_24h = sum(humidity[-24:]) / len(humidity[-24:])

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


def _fetch_weather_batch(
    batch: pd.DataFrame,
) -> list[dict[str, float]]:
    end_date = pd.Timestamp.now().date() - pd.Timedelta(days=1)

    start_date = end_date - pd.Timedelta(days=6)

    params = {
        "latitude": ",".join(batch["latitude"].astype(str)),
        "longitude": ",".join(batch["longitude"].astype(str)),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "hourly": ("precipitation," "relative_humidity_2m," "soil_moisture_0_to_7cm"),
        "timezone": "auto",
    }

    response = _request_json(
        WEATHER_URL,
        params,
    )

    locations = _normalise_location_response(
        response=response,
        expected_count=len(batch),
    )

    return [_extract_weather_features(location) for location in locations]


def _fetch_elevations(
    coordinates: list[tuple[float, float]],
) -> list[float]:
    if not coordinates:
        return []

    params = {
        "latitude": ",".join(str(latitude) for latitude, _ in coordinates),
        "longitude": ",".join(str(longitude) for _, longitude in coordinates),
    }

    response = _request_json(
        ELEVATION_URL,
        params,
    )

    elevations = response.get("elevation")

    if not isinstance(elevations, list):
        raise ValueError("Elevation response does not contain elevation list")

    if len(elevations) != len(coordinates):
        raise ValueError(
            "Elevation API returned "
            f"{len(elevations)} values; expected "
            f"{len(coordinates)}"
        )

    return [float(elevation) for elevation in elevations]


def _fetch_elevation_and_slopes(
    batch: pd.DataFrame,
) -> tuple[list[float], list[float]]:
    """
    Fetch center + four neighboring elevations for
    every point in one request.

    Order per point:
        center
        north
        south
        east
        west
    """

    coordinates: list[tuple[float, float]] = []

    for _, row in batch.iterrows():
        latitude = float(row["latitude"])
        longitude = float(row["longitude"])

        coordinates.extend(
            [
                (
                    latitude,
                    longitude,
                ),
                (
                    latitude + OFFSET_DEGREES,
                    longitude,
                ),
                (
                    latitude - OFFSET_DEGREES,
                    longitude,
                ),
                (
                    latitude,
                    longitude + OFFSET_DEGREES,
                ),
                (
                    latitude,
                    longitude - OFFSET_DEGREES,
                ),
            ]
        )

    elevations = _fetch_elevations(coordinates)

    point_elevations: list[float] = []
    slopes: list[float] = []

    for index, (_, row) in enumerate(batch.iterrows()):
        latitude = float(row["latitude"])

        base = index * 5

        center_elevation = elevations[base]

        north_elevation = elevations[base + 1]

        south_elevation = elevations[base + 2]

        east_elevation = elevations[base + 3]

        west_elevation = elevations[base + 4]

        metres_per_lat = 111320

        metres_per_lon = 111320 * math.cos(math.radians(latitude))

        if metres_per_lon == 0:
            raise ValueError("Invalid longitude scale at latitude " f"{latitude}")

        dz_dy = (north_elevation - south_elevation) / (
            2 * OFFSET_DEGREES * metres_per_lat
        )

        dz_dx = (east_elevation - west_elevation) / (
            2 * OFFSET_DEGREES * metres_per_lon
        )

        gradient = math.sqrt(dz_dx**2 + dz_dy**2)

        slope_radians = math.atan(gradient)

        slope_degrees = math.degrees(slope_radians)

        point_elevations.append(float(center_elevation))

        slopes.append(
            round(
                slope_degrees,
                2,
            )
        )

    return point_elevations, slopes


def _process_batch(
    batch: pd.DataFrame,
) -> list[dict[str, Any]]:
    weather_features = _fetch_weather_batch(batch)

    elevations, slopes = _fetch_elevation_and_slopes(batch)

    if not (len(weather_features) == len(elevations) == len(slopes) == len(batch)):
        raise ValueError("Batch result lengths do not match")

    predictions: list[dict[str, Any]] = []

    for index, (_, row) in enumerate(batch.iterrows()):
        weather = weather_features[index]

        features = {
            "rainfall_24h": weather["rainfall_24h"],
            "rainfall_48h": weather["rainfall_48h"],
            "rainfall_7d": weather["rainfall_7d"],
            "average_humidity_24h": weather["average_humidity_24h"],
            "soil_moisture": weather["soil_moisture"],
            "elevation": elevations[index],
            "slope": slopes[index],
        }

        prediction = predict_risk(features)

        predictions.append(
            {
                "district_id": int(row["district_id"]),
                "district_name": str(row["district_name"]),
                "state_name": str(row["state_name"]),
                "point_number": int(row["point_number"]),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "probability": prediction["probability"],
                "risk_score": prediction["risk_score"],
                "risk_level": prediction["risk_level"],
            }
        )

    return predictions


def _aggregate_districts(
    point_predictions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if not point_predictions:
        raise ValueError("No point predictions were generated")

    point_df = pd.DataFrame(point_predictions)

    district_results: list[dict[str, Any]] = []

    for district_id, group in point_df.groupby(
        "district_id",
        sort=True,
    ):
        average_probability = float(group["probability"].mean())

        risk_score = round(
            average_probability * 100,
            2,
        )

        if risk_score < 35:
            risk_level = "LOW"
        elif risk_score < 70:
            risk_level = "MODERATE"
        else:
            risk_level = "HIGH"

        first = group.iloc[0]

        district_results.append(
            {
                "district_id": int(district_id), # pyright: ignore[reportArgumentType]
                "district_name": str(first["district_name"]),
                "state_name": str(first["state_name"]),
                "risk_score": risk_score,
                "probability": round(
                    average_probability,
                    4,
                ),
                "risk_level": risk_level,
                "points_analyzed": int(len(group)),
            }
        )

    return district_results


def calculate_all_district_risks() -> list[dict[str, Any]]:
    """
    Calculate six-point risk predictions for all
    districts and aggregate them into one result
    per district.
    """

    start_time = time.perf_counter()

    points = _load_points()

    if points.empty:
        raise ValueError("District point dataset is empty")

    batches = list(
        _chunks(
            points,
            BATCH_SIZE,
        )
    )

    print(
        "[district-risk] "
        f"Loaded {len(points)} points "
        f"across {len(batches)} batches"
    )

    point_predictions: list[dict[str, Any]] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_index = {
            executor.submit(
                _process_batch,
                batch,
            ): index
            for index, batch in enumerate(batches)
        }

        completed = 0

        for future in as_completed(future_to_index):
            batch_index = future_to_index[future]

            completed += 1

            try:
                predictions = future.result()

                point_predictions.extend(predictions)

                print(
                    "[district-risk] "
                    f"Batch {batch_index + 1}/"
                    f"{len(batches)} complete "
                    f"({completed}/"
                    f"{len(batches)})"
                )

            except Exception as error:
                raise RuntimeError(
                    f"District batch " f"{batch_index + 1} failed: " f"{error}"
                ) from error

    district_results = _aggregate_districts(point_predictions)

    elapsed = round(
        time.perf_counter() - start_time,
        2,
    )

    print(
        "[district-risk] "
        f"Completed {len(district_results)} "
        f"districts from "
        f"{len(point_predictions)} points "
        f"in {elapsed} seconds"
    )

    return district_results
