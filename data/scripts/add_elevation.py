import time

import pandas as pd
import requests

INPUT_FILE = "data/processed/landslide_training_data.csv"
OUTPUT_FILE = "data/processed/landslide_training_data_elevation.csv"

ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"

BATCH_SIZE = 50
MAX_RETRIES = 5


def get_elevations(
    latitudes: list[float],
    longitudes: list[float],
) -> list[float]:

    params = {
        "latitude": ",".join(map(str, latitudes)),
        "longitude": ",".join(map(str, longitudes)),
    }

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(
                ELEVATION_URL,
                params=params,
                timeout=30,
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


def add_elevation():

    df = pd.read_csv(INPUT_FILE)

    # Reuse existing elevation values if the output file
    # already exists.
    try:
        existing = pd.read_csv(OUTPUT_FILE)

        if "elevation" in existing.columns:
            df["elevation"] = existing["elevation"]

    except FileNotFoundError:
        df["elevation"] = None

    missing_indices = df.index[df["elevation"].isna()]

    print(f"Rows needing elevation: {len(missing_indices)}")

    for start in range(
        0,
        len(missing_indices),
        BATCH_SIZE,
    ):
        batch_indices = missing_indices[start : start + BATCH_SIZE]

        batch = df.loc[batch_indices]

        print(
            f"Processing missing elevations "
            f"{start + 1}-"
            f"{start + len(batch)}/"
            f"{len(missing_indices)}"
        )

        try:
            values = get_elevations(
                batch["latitude"].tolist(),
                batch["longitude"].tolist(),
            )

            df.loc[batch_indices, "elevation"] = values

            # Save progress after every successful batch.
            df.to_csv(
                OUTPUT_FILE,
                index=False,
            )

        except Exception as error:
            print(f"Batch failed: {error}")

        time.sleep(1)

    print()
    print(f"Saved: {OUTPUT_FILE}")

    print(
        "Missing elevation:",
        df["elevation"].isna().sum(),
    )

    print("\nElevation statistics:")
    print(df["elevation"].describe().round(2).to_string())


if __name__ == "__main__":
    add_elevation()
