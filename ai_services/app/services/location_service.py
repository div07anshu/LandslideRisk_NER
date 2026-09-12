import csv
import re
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "ner_districts.csv"


def normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def load_locations() -> list[dict]:
    locations = []

    with DATA_FILE.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:
        reader = csv.DictReader(file, delimiter="\t")

        for row in reader:
            locations.append(
                {
                    "state": row["State"].strip(),
                    "district": row["District"].strip(),
                    "city": row["City"].strip(),
                    "longitude": float(row["Longitude"]),
                    "latitude": float(row["Latitude"]),
                }
            )

    return locations


LOCATIONS = load_locations()


def find_location(text: str) -> dict | None:
    normalized_text = normalize(text)

    # Exact district match
    for location in LOCATIONS:
        if normalize(location["district"]) == normalized_text:
            return location

    # Exact city match
    for location in LOCATIONS:
        if normalize(location["city"]) == normalized_text:
            return location

    # District mentioned inside the sentence
    district_matches = []

    for location in LOCATIONS:
        district = normalize(location["district"])

        if len(district) >= 3 and re.search(
            rf"\b{re.escape(district)}\b",
            normalized_text,
        ):
            district_matches.append(location)

    if len(district_matches) == 1:
        return district_matches[0]

    # City mentioned inside the sentence
    city_matches = []

    for location in LOCATIONS:
        city = normalize(location["city"])

        if len(city) >= 3 and re.search(
            rf"\b{re.escape(city)}\b",
            normalized_text,
        ):
            city_matches.append(location)

    if len(city_matches) == 1:
        return city_matches[0]

    return None


def location_from_context(context_location: dict | None) -> dict | None:
    if not context_location:
        return None

    try:
        return {
            "state": context_location["state"],
            "district": context_location["district"],
            "city": context_location["city"],
            "longitude": float(context_location["longitude"]),
            "latitude": float(context_location["latitude"]),
        }
    except (KeyError, TypeError, ValueError):
        return None


def question_requires_location(message: str) -> bool:
    text = normalize(message)

    location_keywords = [
        "risk",
        "risk score",
        "risk level",
        "landslide risk",
        "rainfall",
        "rain",
        "soil moisture",
        "soil",
        "slope",
        "elevation",
        "humidity",
        "current condition",
        "current conditions",
        "live data",
        "latest data",
        "latest risk",
        "danger",
        "warning",
        "hazard",
        "status",
        "prediction",
    ]

    return any(keyword in text for keyword in location_keywords)


def format_location(location: dict) -> str:
    return f"{location['district']}, {location['state']} " f"(near {location['city']})"
