from __future__ import annotations

import json
import math
import time
from pathlib import Path
from typing import Any

import pandas as pd
import requests

ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"

REQUEST_TIMEOUT = 30
REQUEST_RETRIES = 3
RETRY_DELAY_SECONDS = 3
BATCH_SIZE = 20
OFFSET_DEGREES = 0.001

BASE_DIR = Path(__file__).resolve().parents[2]
INPUT_PATH = BASE_DIR / "data" / "ner_district_6_points.geojson"
OUTPUT_PATH = BASE_DIR / "data" / "district_features.csv"


def request_json(
    params: dict[str, Any],
) -> dict[str, Any]:
    last_error: Exception | None = None

    for attempt in range(REQUEST_RETRIES):
        try:
            response = requests.get(
                ELEVATION_URL,
                params=params,
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            return response.json()

        except requests.RequestException as error:
            last_error = error

            print(
                f"Elevation request failed "
                f"(attempt {attempt + 1}/{REQUEST_RETRIES}): "
                f"{error}"
            )

            if attempt < REQUEST_RETRIES - 1:
                time.sleep(RETRY_DELAY_SECONDS * (attempt + 1))

    raise RuntimeError(
        f"Elevation request failed after " f"{REQUEST_RETRIES} attempts: {last_error}"
    )


def load_points() -> pd.DataFrame:
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Input GeoJSON not found: {INPUT_PATH}")

    with INPUT_PATH.open(
        "r",
        encoding="utf-8",
    ) as file:
        geojson = json.load(file)

    records: list[dict[str, Any]] = []

    for feature in geojson.get("features", []):
        properties = feature.get("properties")

        if properties:
            records.append(properties)

    if not records:
        raise ValueError("No points found in input GeoJSON")

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
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    df["district_id"] = df["district_id"].astype(int)
    df["point_number"] = df["point_number"].astype(int)
    df["latitude"] = df["latitude"].astype(float)
    df["longitude"] = df["longitude"].astype(float)

    return df


def chunks(
    df: pd.DataFrame,
    size: int,
):
    for start in range(
        0,
        len(df),
        size,
    ):
        yield df.iloc[start : start + size].copy()


def fetch_elevations(
    coordinates: list[tuple[float, float]],
) -> list[float]:
    if not coordinates:
        return []

    params = {
        "latitude": ",".join(str(latitude) for latitude, _ in coordinates),
        "longitude": ",".join(str(longitude) for _, longitude in coordinates),
    }

    response = request_json(params)

    elevations = response.get("elevation")

    if not isinstance(
        elevations,
        list,
    ):
        raise ValueError("Elevation API returned invalid data")

    if len(elevations) != len(coordinates):
        raise ValueError(
            "Elevation API returned "
            f"{len(elevations)} values; expected "
            f"{len(coordinates)}"
        )

    return [float(elevation) for elevation in elevations]


def calculate_elevation_and_slope(
    batch: pd.DataFrame,
) -> tuple[list[float], list[float]]:
    """
    For every point we request five elevations:

        0 = center
        1 = north
        2 = south
        3 = east
        4 = west

    These are then used to calculate the same slope
    formula as the existing risk_service.py.
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

    elevations = fetch_elevations(coordinates)

    center_elevations: list[float] = []
    slopes: list[float] = []

    for index, (_, row) in enumerate(batch.iterrows()):
        latitude = float(row["latitude"])

        base = index * 5

        center = elevations[base]
        north = elevations[base + 1]
        south = elevations[base + 2]
        east = elevations[base + 3]
        west = elevations[base + 4]

        metres_per_lat = 111320

        metres_per_lon = 111320 * math.cos(math.radians(latitude))

        if metres_per_lon == 0:
            raise ValueError(f"Invalid longitude scale " f"at latitude {latitude}")

        dz_dy = (north - south) / (2 * OFFSET_DEGREES * metres_per_lat)

        dz_dx = (east - west) / (2 * OFFSET_DEGREES * metres_per_lon)

        gradient = math.sqrt(dz_dx**2 + dz_dy**2)

        slope_radians = math.atan(gradient)

        slope_degrees = math.degrees(slope_radians)

        center_elevations.append(round(center, 2))

        slopes.append(round(slope_degrees, 2))

    return (
        center_elevations,
        slopes,
    )


def prepare_features() -> None:
    start_time = time.perf_counter()

    points = load_points()

    print(f"Loaded {len(points)} points.")

    output_rows: list[dict[str, Any]] = []

    batches = list(
        chunks(
            points,
            BATCH_SIZE,
        )
    )

    print(f"Processing {len(batches)} batches...")

    for index, batch in enumerate(
        batches,
        start=1,
    ):
        print(f"Processing batch " f"{index}/{len(batches)}...")

        elevations, slopes = calculate_elevation_and_slope(batch)

        for row_index, (_, row) in enumerate(batch.iterrows()):
            output_rows.append(
                {
                    "district_id": int(row["district_id"]),
                    "district_name": str(row["district_name"]),
                    "state_name": str(row["state_name"]),
                    "point_number": int(row["point_number"]),
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "elevation": elevations[row_index],
                    "slope": slopes[row_index],
                }
            )

        print(f"Batch {index}/{len(batches)} complete.")

    result = pd.DataFrame(output_rows)

    result.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    elapsed = round(
        time.perf_counter() - start_time,
        2,
    )

    print()
    print("Feature preprocessing complete.")
    print(f"Points processed: {len(result)}")
    print(f"Districts: {result['district_id'].nunique()}")
    print(f"Output: {OUTPUT_PATH}")
    print(f"Time: {elapsed} seconds")


if __name__ == "__main__":
    prepare_features()
