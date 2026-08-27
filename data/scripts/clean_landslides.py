import pandas as pd

RAW_FILE = "data/raw/Global_Landslide_Catalog_Export_rows.csv"
OUTPUT_FILE = "data/processed/ner_landslides.csv"


def clean_landslide_data():
    df = pd.read_csv(RAW_FILE)
    print("Original shape:", df.shape)

    columns = [
        "event_id",
        "event_date",
        "landslide_category",
        "landslide_trigger",
        "landslide_size",
        "landslide_setting",
        "country_name",
        "admin_division_name",
        "longitude",
        "latitude",
    ]

    df = df[columns]
    df = df[df["country_name"].fillna("").str.strip().str.lower() == "india"]

    state_mapping = {
        "arunāchal pradesh": "Arunachal Pradesh",
        "arunachal pradesh": "Arunachal Pradesh",
        "assam": "Assam",
        "meghālaya": "Meghalaya",
        "meghalaya": "Meghalaya",
        "mizoram": "Mizoram",
        "manipur": "Manipur",
        "nāgāland": "Nagaland",
        "nagaland": "Nagaland",
        "sikkim": "Sikkim",
        "tripura": "Tripura",
    }

    df["state_normalized"] = (
        df["admin_division_name"].fillna("").str.strip().str.lower().map(state_mapping)
    )

    ner_states = [
        "Arunachal Pradesh",
        "Assam",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Sikkim",
        "Tripura",
    ]

    df = df[df["state_normalized"].isin(ner_states)]

    df["event_date"] = pd.to_datetime(
        df["event_date"],
        errors="coerce",
    )

    df["latitude"] = pd.to_numeric(
        df["latitude"],
        errors="coerce",
    )

    df["longitude"] = pd.to_numeric(
        df["longitude"],
        errors="coerce",
    )

    df = df.dropna(
        subset=[
            "latitude",
            "longitude",
            "event_date",
            "state_normalized",
        ]
    )

    df = df[df["latitude"].between(-90, 90) & df["longitude"].between(-180, 180)]
    df = df.drop_duplicates(subset=["event_id"])

    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print("Cleaned shape:", df.shape)
    print("\nEvents by state:")
    print(df["state_normalized"].value_counts())

    print("\nSaved to:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    clean_landslide_data()
