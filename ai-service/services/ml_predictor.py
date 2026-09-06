import os
import sys
import joblib
import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from ml.features import FEATURES, FEATURE_SCHEMA_VERSION
from config import settings
from models.schemas import TelemetryPayload, PredictResponse

class MLPredictor:
    def __init__(self):
        self.model_bundle = None
        self._load_model()

    def _load_model(self):
        try:
            bundle = joblib.load(settings.MODEL_PATH)
            if bundle.get("feature_order") != list(FEATURES) or bundle.get("feature_schema_version") != FEATURE_SCHEMA_VERSION:
                raise ValueError("artifact feature schema is incompatible")
            self.model_bundle = bundle
            print(f"[MLPredictor] Loaded canonical model {bundle['model_version']}")
        except Exception as error:
            print(f"[MLPredictor] Model unavailable: {error}")
            self.model_bundle = None

    def predict(self, telemetry: TelemetryPayload):
        if not self.model_bundle:
            raise RuntimeError("Trained ML model is unavailable; prediction was not generated.")
        values = telemetry.model_dump()
        # Preserve the exact named feature schema used when fitting the models.
        vector = pd.DataFrame([[float(values[name]) for name in FEATURES]], columns=FEATURES)
        try:
            probability = float(self.model_bundle["binary_model"].predict_proba(vector)[0][1])
            failure_type = str(self.model_bundle["multiclass_model"].predict(vector)[0])
        except Exception as error:
            raise RuntimeError(f"Trained ML model inference failed: {error}") from error
        risk = "HIGH" if probability >= .75 else "MEDIUM" if probability >= .4 else "LOW"
        return PredictResponse(
            failure_probability=round(probability, 4), risk_level=risk,
            predicted_failure_type=failure_type, is_failure_predicted=probability >= .5,
            feature_signals={name: values[name] for name in FEATURES},
            model_version=self.model_bundle["model_version"], feature_schema_version=FEATURE_SCHEMA_VERSION,
        )

ml_predictor = MLPredictor()
