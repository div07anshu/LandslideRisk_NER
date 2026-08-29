import math
import time

import pandas as pd
import requests

INPUT_FILE = "data/processed/landslide_training_data_elevation.csv"
OUTPUT_FILE = "data/processed/landslide_training_data_terrain.csv"

ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"

# ~100 m north/south/east/west from the target point.
OFFSET_DEGREES = 0.001

MAX_RETRIES = 5


def get_elevations(latitudes, longitudes):
    params = {
        "latitude": ",".join(map(str, latitudes)),
        "longitude": ",".join(map(str, longitudes)),
    }

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(
                ELEVATION_URL,
                params=params,
                timeout=60,
            )

            if response.status_code == 429:
                wait_time = 2**attempt
                print(f"Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
                continue

            response.raise_for_status()

            return response.json()["elevation"]

        except requests.RequestException as error:
            if attempt == MAX_RETRIES - 1:
                raise

            wait_time = 2**attempt

            print(f"Request failed: {error}")
            print(f"Retrying in {wait_time}s...")

            time.sleep(wait_time)

    raise RuntimeError("Failed to retrieve elevation data")


def calculate_slope(latitude, longitude):
    """
    Estimate slope from four neighboring elevation points.

    Returns slope in degrees.
    """

    lat = float(latitude)
    lon = float(longitude)

    # North / South
    north_lat = lat + OFFSET_DEGREES
    south_lat = lat - OFFSET_DEGREES

    # East / West
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

    elevations = get_elevations(lats, lons)

    north_elev = elevations[0]
    south_elev = elevations[1]
    east_elev = elevations[2]
    west_elev = elevations[3]

    # Approximate metres per degree.
    metres_per_lat = 111_320

    metres_per_lon = 111_320 * math.cos(math.radians(lat))

    # Elevation change / horizontal distance.
    dz_dy = (north_elev - south_elev) / (2 * OFFSET_DEGREES * metres_per_lat)

    dz_dx = (east_elev - west_elev) / (2 * OFFSET_DEGREES * metres_per_lon)

    gradient = math.sqrt(dz_dx**2 + dz_dy**2)

    slope_radians = math.atan(gradient)

    slope_degrees = math.degrees(slope_radians)

    return round(slope_degrees, 2)


def add_slope():

    df = pd.read_csv(INPUT_FILE)

    # Reuse existing slope values if the output file exists.
    try:
        existing = pd.read_csv(OUTPUT_FILE)

        if "slope" in existing.columns:
            df["slope"] = existing["slope"]

        else:
            df["slope"] = None

    except FileNotFoundError:
        df["slope"] = None

    missing_indices = df.index[df["slope"].isna()]

    print(f"Rows needing slope: {len(missing_indices)}")

    for position, index in enumerate(
        missing_indices,
        start=1,
    ):
        row = df.loc[index]

        print(
            f"Processing missing slope "
            f"{position}/{len(missing_indices)} "
            f"(event_id={row['event_id']})"
        )

        try:
            slope = calculate_slope(
                row["latitude"],
                row["longitude"],
            )

            df.loc[index, "slope"] = slope

            # Save after every successful calculation.
            df.to_csv(
                OUTPUT_FILE,
                index=False,
            )

        except Exception as error:
            print(f"  Failed: {error}")

        time.sleep(1)

    print()
    print(f"Saved: {OUTPUT_FILE}")

    print(
        "Missing slope:",
        df["slope"].isna().sum(),
    )

    print("\nSlope statistics:")
    print(df["slope"].describe().round(2).to_string())


if __name__ == "__main__":
    add_slope()
