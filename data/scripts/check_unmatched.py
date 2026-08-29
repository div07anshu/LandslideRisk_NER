import geopandas as gpd
import pandas as pd

EVENTS_FILE = "data/processed/ner_landslides_districts.csv"
DISTRICTS_FILE = "data/boundaries/ner_districts.geojson"


events = pd.read_csv(EVENTS_FILE)

# Only events where district assignment failed
events = events[events["district"].isna()].copy()

# Convert events to points
events_gdf = gpd.GeoDataFrame(
    events,
    geometry=gpd.points_from_xy(
        events["longitude"],
        events["latitude"],
    ),
    crs="EPSG:4326",
)

# Load district boundaries
districts = gpd.read_file(DISTRICTS_FILE)

# Keep only Sikkim districts
districts = districts[districts["stname"].str.strip().str.lower() == "sikkim"].copy()

# Convert to a metric CRS suitable for Sikkim
events_gdf = events_gdf.to_crs("EPSG:32645")
districts = districts.to_crs("EPSG:32645")

# Find nearest district
result = gpd.sjoin_nearest(
    events_gdf,
    districts[["dtname", "stname", "geometry"]],
    how="left",
    distance_col="distance_m",
)

print(
    result[
        [
            "event_id",
            "event_date",
            "latitude",
            "longitude",
            "dtname",
            "distance_m",
        ]
    ].to_string(index=False)
)
