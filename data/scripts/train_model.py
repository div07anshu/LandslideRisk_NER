from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import (
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split

# =========================================================
# Configuration
# =========================================================

DATA_FILE = "data/processed/landslide_training_data_terrain.csv"
MODEL_FILE = "ai_services/app/models/landslide_risk_model.joblib"

FEATURES = [
    "rainfall_24h",
    "rainfall_48h",
    "rainfall_7d",
    "average_humidity_24h",
    "soil_moisture",
    "elevation",
    "slope",
]

TARGET = "landslide"

TEST_SIZE = 0.20
RANDOM_STATE = 42
CV_FOLDS = 5


# =========================================================
# Load data
# =========================================================


def load_dataset():
    df = pd.read_csv(DATA_FILE)

    required_columns = FEATURES + [TARGET]

    missing_columns = [
        column for column in required_columns if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    # Keep only model features and target.
    df = df[required_columns].copy()

    # Remove rows with missing model values.
    df = df.dropna()

    X = df[FEATURES]
    y = df[TARGET]

    return X, y


# =========================================================
# Models
# =========================================================


def create_models():
    return {
        "Random Forest": RandomForestClassifier(
            n_estimators=400,
            max_depth=8,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        "Extra Trees": ExtraTreesClassifier(
            n_estimators=400,
            max_depth=8,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=250,
            learning_rate=0.04,
            max_depth=3,
            min_samples_leaf=4,
            random_state=RANDOM_STATE,
        ),
    }


# =========================================================
# Cross validation
# =========================================================


def cross_validate_models(X, y, models):
    cv = StratifiedKFold(
        n_splits=CV_FOLDS,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    results = []

    print()
    print("=" * 70)
    print("5-FOLD CROSS VALIDATION")
    print("=" * 70)

    for name, model in models.items():
        roc_scores = cross_val_score(
            model,
            X,
            y,
            cv=cv,
            scoring="roc_auc",
            n_jobs=-1,
        )

        f1_scores = cross_val_score(
            model,
            X,
            y,
            cv=cv,
            scoring="f1",
            n_jobs=-1,
        )

        recall_scores = cross_val_score(
            model,
            X,
            y,
            cv=cv,
            scoring="recall",
            n_jobs=-1,
        )

        result = {
            "name": name,
            "model": model,
            "roc_auc_mean": roc_scores.mean(),
            "roc_auc_std": roc_scores.std(),
            "f1_mean": f1_scores.mean(),
            "recall_mean": recall_scores.mean(),
        }

        results.append(result)

        print()
        print(name)
        print(f"ROC-AUC : {roc_scores.mean():.4f} +/- {roc_scores.std():.4f}")
        print(f"F1      : {f1_scores.mean():.4f}")
        print(f"Recall  : {recall_scores.mean():.4f}")

    return results


# =========================================================
# Evaluate selected model on held-out test set
# =========================================================


def evaluate_model(model, X_train, X_test, y_train, y_test):

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    probabilities = model.predict_proba(X_test)[:, 1]

    print()
    print("=" * 70)
    print("HELD-OUT TEST RESULTS")
    print("=" * 70)

    print(f"Accuracy : {accuracy_score(y_test, predictions):.4f}")

    print(f"Precision: {precision_score(y_test, predictions, zero_division=0):.4f}")

    print(f"Recall   : {recall_score(y_test, predictions, zero_division=0):.4f}")

    print(f"F1       : {f1_score(y_test, predictions, zero_division=0):.4f}")

    print(f"ROC-AUC  : {roc_auc_score(y_test, probabilities):.4f}")

    print("\nConfusion Matrix:")
    print(
        confusion_matrix(
            y_test,
            predictions,
        )
    )

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    return model


# =========================================================
# Feature importance
# =========================================================


def print_feature_importance(model):

    if not hasattr(model, "feature_importances_"):
        return

    importance = pd.Series(
        model.feature_importances_,
        index=FEATURES,
    ).sort_values(ascending=False)

    print()
    print("=" * 70)
    print("FEATURE IMPORTANCE")
    print("=" * 70)

    print(importance.to_string())


# =========================================================
# Train final model using all available data
# =========================================================


def train_final_model(model, X, y):

    print()
    print("=" * 70)
    print("TRAINING FINAL MODEL")
    print("=" * 70)

    model.fit(X, y)

    return model


# =========================================================
# Save model
# =========================================================


def save_model(model):

    model_path = Path(MODEL_FILE)

    model_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    artifact = {
        "model": model,
        "features": FEATURES,
        "risk_thresholds": {
            "low_max": 34,
            "moderate_max": 69,
            "high_min": 70,
        },
    }

    joblib.dump(
        artifact,
        model_path,
    )

    print()
    print(f"Model saved to: {model_path}")


# =========================================================
# Main
# =========================================================


def main():

    print("Loading dataset...")

    X, y = load_dataset()

    print(f"Samples : {len(X)}")

    print(f"Features: {FEATURES}")

    print()
    print("Class distribution:")
    print(y.value_counts().sort_index())

    # -----------------------------------------------------
    # Hold-out test set
    # -----------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        stratify=y,
        random_state=RANDOM_STATE,
    )

    print()
    print(f"Training samples: {len(X_train)}")

    print(f"Testing samples : {len(X_test)}")

    # -----------------------------------------------------
    # Candidate models
    # -----------------------------------------------------

    models = create_models()

    # -----------------------------------------------------
    # Cross-validation
    # -----------------------------------------------------

    results = cross_validate_models(
        X_train,
        y_train,
        models,
    )

    # Select based primarily on ROC-AUC.
    best_result = max(
        results,
        key=lambda item: item["roc_auc_mean"],
    )

    best_name = best_result["name"]

    print()
    print("=" * 70)
    print("SELECTED MODEL")
    print("=" * 70)

    print(f"{best_name}")

    print(f"CV ROC-AUC: {best_result['roc_auc_mean']:.4f}")

    # -----------------------------------------------------
    # Evaluate on held-out test set
    # -----------------------------------------------------

    best_model = evaluate_model(
        best_result["model"],
        X_train,
        X_test,
        y_train,
        y_test,
    )

    print_feature_importance(best_model)

    # -----------------------------------------------------
    # Retrain on all available data
    # -----------------------------------------------------

    final_model = train_final_model(
        best_model,
        X,
        y,
    )

    # -----------------------------------------------------
    # Save model
    # -----------------------------------------------------

    save_model(final_model)

    print()
    print("=" * 70)
    print("TRAINING COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
