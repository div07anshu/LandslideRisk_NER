import geopandas as gpd
import pandas as pd

LANDSLIDES_FILE = "data/processed/ner_landslides.csv"
DISTRICTS_FILE = "data/boundaries/ner_districts.geojson"
OUTPUT_FILE = "data/processed/ner_landslides_districts.csv"


def assign_districts():
    # Load cleaned landslide events
    events = pd.read_csv(LANDSLIDES_FILE)

    # Convert event coordinates into geographic points
    events_gdf = gpd.GeoDataFrame(
        events,
        geometry=gpd.points_from_xy(
            events["longitude"],
            events["latitude"],
        ),
        crs="EPSG:4326",
    )

    # Load NER district boundaries
    districts = gpd.read_file(DISTRICTS_FILE)

    # Ensure both datasets use the same coordinate system
    districts = districts.to_crs("EPSG:4326")

    # Keep only the fields we need from district boundaries
    districts = districts[
        [
            "dtname",
            "stname",
            "stcode11",
            "dtcode11",
            "dist_lgd",
            "state_lgd",
            "geometry",
        ]
    ]

    # Find which district polygon contains each landslide point
    result = gpd.sjoin(
        events_gdf,
        districts,
        how="left",
        predicate="intersects",
    )

    # Rename district fields
    result = result.rename(
        columns={
            "dtname": "district",
            "stname": "district_state",
            "stcode11": "district_state_code",
            "dtcode11": "district_code",
            "dist_lgd": "district_lgd",
            "state_lgd": "state_lgd",
        }
    )

    # Remove geometry/index columns before saving CSV
    result = result.drop(
        columns=["geometry", "index_right"],
        errors="ignore",
    )

    # Save enriched dataset
    result.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    # Summary
    print(f"Saved: {OUTPUT_FILE}")
    print(f"Total events: {len(result)}")

    print("\nEvents by state:")
    print(result["district_state"].value_counts())

    print("\nEvents without district:")
    print(result["district"].isna().sum())


if __name__ == "__main__":
    assign_districts()
