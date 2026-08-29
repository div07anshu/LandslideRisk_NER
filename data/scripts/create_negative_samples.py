import random
from typing import cast

import geopandas as gpd
import pandas as pd
from shapely import union_all
from shapely.geometry import Point

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

POSITIVE_FILE = "data/processed/ner_landslides_weather.csv"
DISTRICTS_FILE = "data/boundaries/ner_districts.geojson"
OUTPUT_FILE = "data/processed/negative_samples.csv"

RANDOM_SEED = 42

# Minimum distance between a negative point
# and a known landslide event.
MIN_DISTANCE_METERS = 1000

# Maximum attempts to find a valid point
MAX_ATTEMPTS_PER_POINT = 500


random.seed(RANDOM_SEED)


def generate_random_point(polygon):
    """
    Generate a random point inside a polygon.
    """

    min_x, min_y, max_x, max_y = polygon.bounds

    for _ in range(MAX_ATTEMPTS_PER_POINT):
        x = random.uniform(min_x, max_x)
        y = random.uniform(min_y, max_y)

        point = Point(x, y)

        if polygon.contains(point):
            return point

    return None


def create_negative_samples():

    # -----------------------------------------------------
    # 1. Load positive landslide events
    # -----------------------------------------------------

    positives = pd.read_csv(POSITIVE_FILE)

    # Safety check
    positives = positives.dropna(
        subset=[
            "district",
            "latitude",
            "longitude",
            "event_date",
        ]
    ).copy()

    print(f"Positive events available: {len(positives)}")

    # -----------------------------------------------------
    # 2. Convert positive events to GeoDataFrame
    # -----------------------------------------------------

    positive_gdf = gpd.GeoDataFrame(
        positives,
        geometry=gpd.points_from_xy(
            positives["longitude"],
            positives["latitude"],
        ),
        crs="EPSG:4326",
    )

    # -----------------------------------------------------
    # 3. Load district boundaries
    # -----------------------------------------------------

    districts = gpd.read_file(DISTRICTS_FILE)

    districts = districts.to_crs("EPSG:4326")

    # Keep only districts represented in our events
    districts = districts[
        districts["dtname"].isin(positives["district"].unique())
    ].copy()

    # -----------------------------------------------------
    # 4. Convert to Web Mercator for meter-based buffer
    # -----------------------------------------------------

    positive_metric = positive_gdf.to_crs("EPSG:3857")

    districts_metric = districts.to_crs("EPSG:3857")

    # -----------------------------------------------------
    # 5. Create 1 km exclusion zones
    # -----------------------------------------------------

    exclusion_buffers = positive_metric.geometry.buffer(MIN_DISTANCE_METERS)

    exclusion_area = union_all(exclusion_buffers)

    # -----------------------------------------------------
    # 6. Generate negative samples
    # -----------------------------------------------------

    negative_rows = []

    for district_name, district_events in positives.groupby("district"):
        # Find district polygon(s)
        district_polygon = districts_metric[
            districts_metric["dtname"] == district_name
        ].geometry.union_all()

        # Remove the 1 km exclusion areas
        available_area = district_polygon.difference(exclusion_area)

        if available_area.is_empty:
            print(f"WARNING: No available area in {district_name}")
            continue

        required = len(district_events)

        generated = 0
        attempts = 0

        while generated < required:
            attempts += 1

            if attempts > required * MAX_ATTEMPTS_PER_POINT:
                print(
                    f"WARNING: Could only generate "
                    f"{generated}/{required} negatives "
                    f"for {district_name}"
                )
                break

            point = generate_random_point(available_area)

            if point is None:
                continue

            # Convert back to geographic coordinates
            point_gdf = gpd.GeoSeries(
                [point],
                crs="EPSG:3857",
            ).to_crs("EPSG:4326")

            point = cast(Point, point_gdf.iloc[0])

            # Sample an event date from the same
            # distribution as the positive events.
            sampled_date = random.choice(positives["event_date"].tolist())

            negative_rows.append(
                {
                    "event_id": (f"NEG_{len(negative_rows) + 1:04d}"),
                    "event_date": sampled_date,
                    "district": district_name,
                    "latitude": point.y,
                    "longitude": point.x,
                    "landslide": 0,
                }
            )

            generated += 1

    # -----------------------------------------------------
    # 7. Save
    # -----------------------------------------------------

    negatives = pd.DataFrame(negative_rows)

    negatives.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    # -----------------------------------------------------
    # 8. Summary
    # -----------------------------------------------------

    print()
    print(f"Negative samples generated: {len(negatives)}")

    print(f"Saved to: {OUTPUT_FILE}")

    print("\nNegative samples by district:")
    print(negatives["district"].value_counts().to_string())


if __name__ == "__main__":
    create_negative_samples()
