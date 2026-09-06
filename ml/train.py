#!/usr/bin/env python3
"""Canonical reproducible Random Forest training pipeline.

Results are synthetic-dataset evaluation only and are not production metrics.
"""
from datetime import datetime, timezone
import json
from pathlib import Path
import joblib
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from sklearn.model_selection import train_test_split
from features import FEATURES, FEATURE_SCHEMA_VERSION, FAILURE_CLASSES, validate_training_dataset_columns
from generate_dataset import generate_dataset, SEED

ROOT = Path(__file__).parent
DATASET_PATH = ROOT / "dataset" / "synthetic_precursor_telemetry.csv"
MODEL_PATH = ROOT / "model.joblib"
EVALUATION_PATH = ROOT / "evaluation.json"
MODEL_VERSION = "rf-precursor-1.0.0"

def load_dataset():
    if not DATASET_PATH.exists():
        DATASET_PATH.parent.mkdir(exist_ok=True)
        generate_dataset().to_csv(DATASET_PATH, index=False)
    return pd.read_csv(DATASET_PATH)

def split_dataset(dataset):
    validate_training_dataset_columns(dataset.columns)
    train, remainder = train_test_split(dataset, test_size=0.30, random_state=SEED, stratify=dataset["failure_type"])
    validation, test = train_test_split(remainder, test_size=0.50, random_state=SEED, stratify=remainder["failure_type"])
    return train, validation, test

def metric_summary(y_true, y_pred, labels):
    precision, recall, f1, support = precision_recall_fscore_support(y_true, y_pred, labels=labels, zero_division=0)
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "labels": list(labels),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
        "per_class": {str(label): {"precision": float(p), "recall": float(r), "f1": float(f), "support": int(s)} for label, p, r, f, s in zip(labels, precision, recall, f1, support)},
    }

def train_models():
    dataset = load_dataset()
    train, validation, test = split_dataset(dataset)
    x_train = train.loc[:, FEATURES]
    # One worker keeps artifacts reproducible and works in constrained runners.
    binary_model = RandomForestClassifier(n_estimators=250, max_depth=10, min_samples_leaf=4, class_weight="balanced", random_state=SEED, n_jobs=1)
    multiclass_model = RandomForestClassifier(n_estimators=300, max_depth=12, min_samples_leaf=4, class_weight="balanced", random_state=SEED, n_jobs=1)
    binary_model.fit(x_train, train.failure_label)
    multiclass_model.fit(x_train, train.failure_type)
    binary_predictions = binary_model.predict(test.loc[:, FEATURES])
    multiclass_predictions = multiclass_model.predict(test.loc[:, FEATURES])
    binary_metrics = metric_summary(test.failure_label, binary_predictions, [0, 1])
    tn, fp = binary_metrics["confusion_matrix"][0]
    fn, tp = binary_metrics["confusion_matrix"][1]
    binary_metrics["false_positive_rate"] = fp / (fp + tn) if fp + tn else None
    binary_metrics["false_negative_rate"] = fn / (fn + tp) if fn + tp else None
    evaluation = {
        "disclaimer": "These results are based on a synthetic dataset and do not represent production performance.",
        "dataset": {"synthetic": True, "total_samples": len(dataset), "seed": SEED, "split": {"train": len(train), "validation": len(validation), "test": len(test)}},
        "binary_failure": binary_metrics,
        "multiclass_failure_type": metric_summary(test.failure_type, multiclass_predictions, FAILURE_CLASSES),
    }
    bundle = {
        "artifact_format": "ai-devops-copilot-rf-bundle/v1", "model_version": MODEL_VERSION,
        "feature_schema_version": FEATURE_SCHEMA_VERSION, "feature_order": list(FEATURES),
        "class_labels": list(multiclass_model.classes_), "binary_model": binary_model, "multiclass_model": multiclass_model,
        "metadata": {"synthetic_dataset": True, "seed": SEED, "scikit_learn_version": sklearn.__version__, "trained_at_utc": datetime.now(timezone.utc).isoformat(), "dataset_path": DATASET_PATH.name},
    }
    joblib.dump(bundle, MODEL_PATH)
    EVALUATION_PATH.write_text(json.dumps(evaluation, indent=2), encoding="utf-8")
    return bundle, evaluation

if __name__ == "__main__":
    _, results = train_models()
    print(results["disclaimer"])
    print(json.dumps(results, indent=2))
