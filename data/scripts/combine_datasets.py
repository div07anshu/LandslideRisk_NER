import pandas as pd

POSITIVE_FILE = "data/processed/ner_landslides_weather.csv"
NEGATIVE_FILE = "data/processed/negative_samples_weather.csv"

OUTPUT_FILE = "data/processed/landslide_training_data.csv"


def combine_datasets():
    positive = pd.read_csv(POSITIVE_FILE)
    negative = pd.read_csv(NEGATIVE_FILE)

    print("Positive samples:", len(positive))
    print("Negative samples:", len(negative))

    # Combine the two datasets.
    df = pd.concat(
        [positive, negative],
        ignore_index=True,
    )

    # Shuffle the rows so positive and negative samples
    # aren't grouped together.
    df = df.sample(
        frac=1,
        random_state=42,
    ).reset_index(drop=True)

    # Save final training dataset.
    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print()
    print("Final dataset:", OUTPUT_FILE)
    print("Shape:", df.shape)

    print("\nClass distribution:")
    print(df["landslide"].value_counts())

    print("\nMissing values:")
    print(df.isna().sum())


if __name__ == "__main__":
    combine_datasets()
