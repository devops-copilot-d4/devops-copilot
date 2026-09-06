import sys
from pathlib import Path
import joblib
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from features import FEATURES, FORBIDDEN_FEATURES, FAILURE_CLASSES, validate_feature_columns
from train import MODEL_PATH

def test_artifact_has_canonical_contract():
    bundle = joblib.load(MODEL_PATH)
    assert bundle["feature_order"] == list(FEATURES)
    assert set(bundle["class_labels"]) == set(FAILURE_CLASSES)
    assert not set(FEATURES) & FORBIDDEN_FEATURES

def test_leakage_and_missing_features_rejected():
    with pytest.raises(ValueError): validate_feature_columns([*FEATURES, "pod_status"])
    with pytest.raises(ValueError): validate_feature_columns(FEATURES[:-1])
