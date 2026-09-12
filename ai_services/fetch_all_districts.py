"""
Background worker to pre-fetch risk scores for all districts.
Run this script to populate the cache in the background.
"""
import json
import time
import requests
from pathlib import Path

# Load GeoJSON with all districts
GEOJSON_PATH = Path(__file__).parent.parent / "frontend" / "public" / "ner_districts_simplified.geojson"
API_URL = "http://localhost:8000/api/risk/district"
BATCH_SIZE = 3  # Process 3 districts at a time
DELAY_BETWEEN_BATCHES = 5  # seconds


def calculate_centroid(geometry):
    """Calculate centroid of a polygon/multipolygon"""
    if geometry["type"] == "Polygon":
        coords = geometry["coordinates"][0]
        n = len(coords)
        sum_lat = sum(lat for _lng, lat in coords)
        sum_lng = sum(lng for lng, _lat in coords)
        return sum_lat / n, sum_lng / n
    elif geometry["type"] == "MultiPolygon":
        coords = geometry["coordinates"][0][0]
        n = len(coords)
        sum_lat = sum(lat for _lng, lat in coords)
        sum_lng = sum(lng for lng, _lat in coords)
        return sum_lat / n, sum_lng / n
    return 26.2, 92.5  # Default center


def fetch_district_risk(district_name, latitude, longitude):
    """Fetch risk score for a single district"""
    try:
        response = requests.post(
            API_URL,
            json={
                "district_name": district_name,
                "latitude": latitude,
                "longitude": longitude
            },
            timeout=15
        )

        if response.status_code == 200:
            return True, response.json()
        else:
            return False, f"HTTP {response.status_code}"

    except Exception as e:
        return False, str(e)


def main():
    print("🚀 Starting background district risk fetcher")
    print("=" * 60)

    # Load GeoJSON
    if not GEOJSON_PATH.exists():
        print(f"❌ GeoJSON file not found at: {GEOJSON_PATH}")
        return

    with open(GEOJSON_PATH, "r") as f:
        geojson = json.load(f)

    features = geojson.get("features", [])
    total = len(features)

    print(f"📍 Found {total} districts to process")
    print(f"⚙️  Batch size: {BATCH_SIZE}, Delay: {DELAY_BETWEEN_BATCHES}s")
    print("=" * 60)

    successful = 0
    failed = 0

    # Process in batches
    for i in range(0, total, BATCH_SIZE):
        batch = features[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

        print(f"\n📦 Batch {batch_num}/{total_batches}")

        for feature in batch:
            props = feature.get("properties", {})
            district_name = props.get("dtname")

            if not district_name:
                continue

            # Calculate centroid
            lat, lng = calculate_centroid(feature["geometry"])

            print(f"  ⏳ Fetching: {district_name}...", end=" ")

            success, result = fetch_district_risk(district_name, lat, lng)

            if success:
                risk_score = result.get("risk_score", "?") if isinstance(result, dict) else "?"
                risk_level = result.get("risk_level", "?") if isinstance(result, dict) else "?"

                if isinstance(risk_score, (int, float)):
                    print(f"✅ {risk_score:.1f} ({risk_level})")
                else:
                    print(f"✅ {risk_score} ({risk_level})")
                successful += 1
            else:
                print(f"❌ Failed: {result}")
                failed += 1

        # Progress summary
        processed = min(i + BATCH_SIZE, total)
        print(f"  📊 Progress: {processed}/{total} ({processed*100//total}%) | ✅ {successful} | ❌ {failed}")

        # Wait before next batch (except for the last batch)
        if i + BATCH_SIZE < total:
            print(f"  ⏸️  Waiting {DELAY_BETWEEN_BATCHES}s before next batch...")
            time.sleep(DELAY_BETWEEN_BATCHES)

    print("\n" + "=" * 60)
    print("✨ Background fetching complete!")
    print(f"✅ Successful: {successful}/{total} ({successful*100//total}%)")
    print(f"❌ Failed: {failed}/{total} ({failed*100//total if total > 0 else 0}%)")
    print(f"💾 Data cached for 3 hours")
    print("=" * 60)


if __name__ == "__main__":
    main()
