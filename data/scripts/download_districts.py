from pathlib import Path

import requests

URL = (
    "https://mapservice.gov.in/gismapservice/rest/services/"
    "BharatMapService/Admin_Boundary_District/MapServer/1/query"
)

OUTPUT_FILE = Path("data/boundaries/india_districts.geojson")


def download_districts():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    params = {
        "where": "1=1",
        "outFields": "*",
        "returnGeometry": "true",
        "outSR": "4326",
        "f": "geojson",
    }

    response = requests.get(
        URL,
        params=params,
        timeout=60,
    )

    response.raise_for_status()

    OUTPUT_FILE.write_text(
        response.text,
        encoding="utf-8",
    )

    print(f"Saved district boundaries to: {OUTPUT_FILE}")


if __name__ == "__main__":
    download_districts()
