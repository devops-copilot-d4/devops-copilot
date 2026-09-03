import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any
from config import settings
from models.schemas import TelemetryPayload, PredictResponse

class MLPredictor:
    def __init__(self):
        self.model_bundle = None
        self._load_model()
        
    def _load_model(self):
        model_path = settings.MODEL_PATH
        if os.path.exists(model_path):
            try:
                self.model_bundle = joblib.load(model_path)
                print(f"[MLPredictor] Loaded trained model from {model_path}")
            except Exception as e:
                print(f"[MLPredictor] Error loading model: {e}. Falling back to rule-based engine.")
                self.model_bundle = None
        else:
            print(f"[MLPredictor] Model file not found at {model_path}. Using fallback heuristic model.")
            self.model_bundle = None
            
    def predict(self, telemetry: TelemetryPayload) -> PredictResponse:
        data_dict = telemetry.model_dump()
        
        if self.model_bundle:
            try:
                binary_model = self.model_bundle["binary_model"]
                multiclass_model = self.model_bundle["multiclass_model"]
                scaler = self.model_bundle["scaler"]
                encoders = self.model_bundle["categorical_encoders"]
                type_encoder = self.model_bundle["type_encoder"]
                num_cols = self.model_bundle["numerical_features"]
                cat_cols = self.model_bundle["categorical_features"]
                
                # Encode categorical features
                enc_vals = []
                for col in cat_cols:
                    le = encoders[col]
                    val = str(data_dict.get(col, ""))
                    classes = list(le.classes_)
                    code = le.transform([val])[0] if val in classes else 0
                    enc_vals.append(code)
                    
                num_vals = [float(data_dict.get(col, 0.0)) for col in num_cols]
                feature_vector = np.array([num_vals + enc_vals])
                scaled_vector = scaler.transform(feature_vector)
                
                # Probabilities
                prob = float(binary_model.predict_proba(scaled_vector)[0][1])
                multi_class_idx = int(multiclass_model.predict(scaled_vector)[0])
                predicted_type = str(type_encoder.classes_[multi_class_idx])
                
                # If normal, but prob is high, align type
                if prob < 0.40:
                    risk_level = "LOW"
                    predicted_type = "Normal"
                elif prob < 0.75:
                    risk_level = "MEDIUM"
                else:
                    risk_level = "HIGH"
                    
                return PredictResponse(
                    failure_probability=round(prob, 4),
                    risk_level=risk_level,
                    predicted_failure_type=predicted_type,
                    is_failure_predicted=(prob >= 0.50),
                    feature_signals={
                        "cpu": data_dict["cpu_usage"],
                        "memory": data_dict["memory_usage"],
                        "restarts": data_dict["restart_count"],
                        "error_rate": data_dict["error_rate"],
                        "pod_status": data_dict["pod_status"]
                    }
                )
            except Exception as e:
                print(f"[MLPredictor] Inference exception: {e}. Using heuristic fallback.")
                
        # Heuristic Rule-Based Engine (Fallback)
        cpu = telemetry.cpu_usage
        mem = telemetry.memory_usage
        restarts = telemetry.restart_count
        err_rate = telemetry.error_rate
        status = telemetry.pod_status.lower()
        
        prob = 0.05
        predicted_type = "Normal"
        
        if "crashloop" in status or restarts >= 3:
            prob = min(0.98, 0.70 + (restarts * 0.05))
            predicted_type = "CrashLoopBackOff"
        elif "oom" in status or mem >= 90.0:
            prob = min(0.96, 0.65 + ((mem - 80) * 0.02))
            predicted_type = "OOMKilled"
        elif cpu >= 85.0:
            prob = min(0.92, 0.60 + ((cpu - 80) * 0.02))
            predicted_type = "High CPU"
        elif "image" in status or "config" in status:
            prob = 0.90
            predicted_type = "Failed deployment" if "image" in status else "Configuration error"
        elif err_rate > 20.0:
            prob = min(0.88, 0.40 + (err_rate * 0.015))
            predicted_type = "Application health failure"
            
        prob = round(prob, 4)
        risk_level = "HIGH" if prob >= 0.70 else ("MEDIUM" if prob >= 0.40 else "LOW")
        
        return PredictResponse(
            failure_probability=prob,
            risk_level=risk_level,
            predicted_failure_type=predicted_type,
            is_failure_predicted=(prob >= 0.50),
            feature_signals={
                "cpu": cpu,
                "memory": mem,
                "restarts": restarts,
                "error_rate": err_rate,
                "pod_status": telemetry.pod_status
            }
        )

ml_predictor = MLPredictor()
