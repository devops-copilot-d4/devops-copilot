#!/usr/bin/env python3
"""
Research Evaluation Benchmark for AI DevOps Copilot ML Model
Computes official research metrics:
- Accuracy
- Precision
- Recall
- F1-Score
- False Positive Rate (FPR)
- Per-Class Performance Matrix
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)

def evaluate():
    model_path = os.path.join(os.path.dirname(__file__), "model.joblib")
    if not os.path.exists(model_path):
        print("[Evaluate] Model bundle not found, running train pipeline first...")
        from train import train_models
        train_models()
        
    bundle = joblib.load(model_path)
    binary_model = bundle["binary_model"]
    multiclass_model = bundle["multiclass_model"]
    scaler = bundle["scaler"]
    encoders = bundle["categorical_encoders"]
    type_encoder = bundle["type_encoder"]
    num_cols = bundle["numerical_features"]
    cat_cols = bundle["categorical_features"]
    
    csv_path = os.path.join(os.path.dirname(__file__), "dataset", "kubernetes_telemetry_dataset.csv")
    df = pd.read_csv(csv_path)
    
    # Process features
    processed_df = df.copy()
    encoded_cols = []
    for col in cat_cols:
        le = encoders[col]
        classes = list(le.classes_)
        processed_df[col + "_enc"] = processed_df[col].apply(
            lambda s: le.transform([s])[0] if s in classes else 0
        )
        encoded_cols.append(col + "_enc")
        
    X = processed_df[num_cols + encoded_cols].values
    y_true_binary = df["failure_label"].values
    y_true_multi = type_encoder.transform(df["failure_type"].values)
    
    X_scaled = scaler.transform(X)
    
    # Binary Predictions
    y_pred_binary = binary_model.predict(X_scaled)
    y_pred_probs = binary_model.predict_proba(X_scaled)[:, 1]
    
    acc = accuracy_score(y_true_binary, y_pred_binary)
    prec = precision_score(y_true_binary, y_pred_binary)
    rec = recall_score(y_true_binary, y_pred_binary)
    f1 = f1_score(y_true_binary, y_pred_binary)
    
    tn, fp, fn, tp = confusion_matrix(y_true_binary, y_pred_binary).ravel()
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
    
    # Multiclass Predictions
    y_pred_multi = multiclass_model.predict(X_scaled)
    mul_acc = accuracy_score(y_true_multi, y_pred_multi)
    mul_f1_weighted = f1_score(y_true_multi, y_pred_multi, average="weighted")
    
    print("\n" + "=" * 65)
    print("AI DEVOPS COPILOT - ML RESEARCH EVALUATION REPORT")
    print("=" * 65)
    print(f"Total Evaluated Test Samples: {len(df)}")
    print(f"Dataset Split: 2,500 controlled telemetry instances")
    print("-" * 65)
    print("1. BINARY FAILURE PREDICTION METRICS:")
    print(f"   • Accuracy:             {acc * 100:.2f}%")
    print(f"   • Precision:            {prec * 100:.2f}%")
    print(f"   • Recall (Sensitivity): {rec * 100:.2f}%")
    print(f"   • F1-Score:             {f1 * 100:.2f}%")
    print(f"   • False Positive Rate:  {fpr * 100:.2f}%")
    print(f"   • False Negative Rate:  {fnr * 100:.2f}%")
    print("-" * 65)
    print("2. CONFUSION MATRIX (Binary):")
    print(f"   True Negative (Normal correctly identified):  {tn}")
    print(f"   False Positive (Normal flagged as failure):   {fp}")
    print(f"   False Negative (Failure missed):              {fn}")
    print(f"   True Positive (Failure correctly detected):   {tp}")
    print("-" * 65)
    print("3. MULTI-CLASS FAILURE CLASSIFICATION:")
    print(f"   • Multi-class Accuracy:    {mul_acc * 100:.2f}%")
    print(f"   • Weighted F1-Score:       {mul_f1_weighted * 100:.2f}%")
    print("\nPer-Class Breakdown:")
    report = classification_report(
        y_true_multi,
        y_pred_multi,
        target_names=type_encoder.classes_,
        digits=3
    )
    print(report)
    print("=" * 65)
    
    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "fpr": fpr,
        "multiclass_accuracy": mul_acc,
        "multiclass_f1": mul_f1_weighted
    }

if __name__ == "__main__":
    evaluate()
