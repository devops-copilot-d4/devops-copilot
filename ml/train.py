#!/usr/bin/env python3
"""
Machine Learning Training Pipeline for AI DevOps Copilot
Trains Supervised Random Forest Classifiers on Kubernetes operational telemetry:
1. Binary Failure Predictor (Outputs failure probability and risk level)
2. Multi-class Failure Classifier (Predicts failure class among controlled scenarios)
Exports bundled model pipeline to ml/model.joblib
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

NUMERICAL_FEATURES = [
    "cpu_usage",
    "memory_usage",
    "restart_count",
    "error_rate",
    "response_time",
    "recent_deployment",
    "log_error_count",
    "event_count"
]

CATEGORICAL_FEATURES = [
    "pod_status",
    "deployment_status",
    "health_status"
]

def load_data():
    csv_path = os.path.join(os.path.dirname(__file__), "dataset", "kubernetes_telemetry_dataset.csv")
    if not os.path.exists(csv_path):
        print("[Train] Dataset not found, generating now...")
        from generate_dataset import generate_full_dataset
        df = generate_full_dataset(n_samples=2500)
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)
        df.to_csv(csv_path, index=False)
    else:
        df = pd.read_csv(csv_path)
    return df

def preprocess_features(df, encoders=None, is_training=True):
    processed_df = df.copy()
    
    if encoders is None:
        encoders = {}
        
    encoded_cols = []
    for col in CATEGORICAL_FEATURES:
        if is_training:
            le = LabelEncoder()
            processed_df[col + "_enc"] = le.fit_transform(processed_df[col].astype(str))
            encoders[col] = le
        else:
            le = encoders.get(col)
            if le:
                # Handle unseen categories gracefully
                classes = list(le.classes_)
                processed_df[col + "_enc"] = processed_df[col].apply(
                    lambda s: le.transform([s])[0] if s in classes else 0
                )
        encoded_cols.append(col + "_enc")
        
    feature_cols = NUMERICAL_FEATURES + encoded_cols
    X = processed_df[feature_cols].values
    return X, feature_cols, encoders

def train_models():
    print("=" * 60)
    print("AI DevOps Copilot - ML Training Pipeline")
    print("=" * 60)
    
    df = load_data()
    print(f"Loaded dataset with {len(df)} records.")
    
    X, feature_cols, encoders = preprocess_features(df, is_training=True)
    y_binary = df["failure_label"].values
    y_multiclass = df["failure_type"].values
    
    # Label encode multi-class target
    type_encoder = LabelEncoder()
    y_multi_enc = type_encoder.fit_transform(y_multiclass)
    
    # Train / Test split (80% train, 20% test)
    X_train, X_test, y_bin_train, y_bin_test, y_mul_train, y_mul_test = train_test_split(
        X, y_binary, y_multi_enc, test_size=0.2, random_state=42, stratify=y_binary
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("\n[1/2] Training Binary Failure Predictor (Random Forest)...")
    binary_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    binary_model.fit(X_train_scaled, y_bin_train)
    
    # Cross-validation
    cv_scores = cross_val_score(binary_model, X_train_scaled, y_bin_train, cv=5, scoring="f1")
    print(f"5-Fold Cross Validation F1: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    y_bin_pred = binary_model.predict(X_test_scaled)
    bin_acc = accuracy_score(y_bin_test, y_bin_pred)
    bin_prec = precision_score(y_bin_test, y_bin_pred)
    bin_rec = recall_score(y_bin_test, y_bin_pred)
    bin_f1 = f1_score(y_bin_test, y_bin_pred)
    
    print(f"Test Accuracy:  {bin_acc:.4f}")
    print(f"Test Precision: {bin_prec:.4f}")
    print(f"Test Recall:    {bin_rec:.4f}")
    print(f"Test F1-Score:  {bin_f1:.4f}")
    
    print("\n[2/2] Training Multi-class Failure Classifier (Random Forest)...")
    multiclass_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=14,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    multiclass_model.fit(X_train_scaled, y_mul_train)
    y_mul_pred = multiclass_model.predict(X_test_scaled)
    mul_acc = accuracy_score(y_mul_test, y_mul_pred)
    mul_f1 = f1_score(y_mul_test, y_mul_pred, average="weighted")
    print(f"Multi-class Test Accuracy: {mul_acc:.4f}")
    print(f"Multi-class Test F1 (weighted): {mul_f1:.4f}")
    
    # Feature importances
    importances = binary_model.feature_importances_
    feat_importance_dict = {feature_cols[i]: round(float(importances[i]), 4) for i in range(len(feature_cols))}
    sorted_features = sorted(feat_importance_dict.items(), key=lambda x: x[1], reverse=True)
    print("\nTop Predictor Features:")
    for f, imp in sorted_features[:5]:
        print(f"  • {f}: {imp * 100:.2f}%")
        
    model_bundle = {
        "binary_model": binary_model,
        "multiclass_model": multiclass_model,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "categorical_encoders": encoders,
        "type_encoder": type_encoder,
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "classes": list(type_encoder.classes_),
        "metrics": {
            "binary_accuracy": float(bin_acc),
            "binary_precision": float(bin_prec),
            "binary_recall": float(bin_rec),
            "binary_f1": float(bin_f1),
            "multiclass_accuracy": float(mul_acc),
            "multiclass_f1": float(mul_f1)
        }
    }
    
    export_path = os.path.join(os.path.dirname(__file__), "model.joblib")
    joblib.dump(model_bundle, export_path)
    print(f"\n[Export] Serialized model bundle saved to: {export_path}")
    print("=" * 60)
    return model_bundle

if __name__ == "__main__":
    train_models()
