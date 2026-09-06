import os
import sys
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ai-service"))
sys.path.insert(0, str(ROOT))
from models.schemas import TelemetryPayload
from services.ml_predictor import MLPredictor
from ml.features import FEATURES

PAYLOAD = dict(cpu_usage=40, memory_usage=50, restart_count=1, error_rate=2, response_time=.3, recent_deployment=0, log_error_count=1, event_count=1)

def test_valid_prediction_uses_loaded_model():
    predictor = MLPredictor()
    result = predictor.predict(TelemetryPayload(**PAYLOAD))
    assert 0 <= result.failure_probability <= 1
    assert list(result.feature_signals) == list(FEATURES)
    assert result.predicted_failure_type in predictor.model_bundle["class_labels"]

def test_schema_rejects_missing_and_invalid_input():
    with pytest.raises(Exception): TelemetryPayload(**{key: value for key, value in PAYLOAD.items() if key != "event_count"})
    with pytest.raises(Exception): TelemetryPayload(**{**PAYLOAD, "recent_deployment": 2})

def test_missing_artifact_is_unavailable(monkeypatch):
    monkeypatch.setenv("MODEL_PATH", "/does/not/exist.joblib")
    predictor = MLPredictor()
    with pytest.raises(RuntimeError, match="unavailable"):
        predictor.predict(TelemetryPayload(**PAYLOAD))
