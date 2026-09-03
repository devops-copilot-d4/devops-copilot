#!/usr/bin/env python3
"""
Dataset Generator for AI DevOps Copilot ML Failure Prediction
Generates controlled experimental data following the official schema:
timestamp, cpu_usage, memory_usage, restart_count, error_rate,
response_time, recent_deployment, pod_status, deployment_status,
log_error_count, event_count, health_status, failure_type, failure_label
"""

import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Set seed for reproducibility
random.seed(42)
np.random.seed(42)

FAILURE_CLASSES = [
    "Normal",
    "CrashLoopBackOff",
    "OOMKilled",
    "High CPU",
    "Failed deployment",
    "Application health failure",
    "Configuration error"
]

def generate_normal_sample(base_time):
    return {
        "timestamp": base_time.isoformat(),
        "cpu_usage": round(random.uniform(15.0, 55.0), 2),
        "memory_usage": round(random.uniform(20.0, 60.0), 2),
        "restart_count": random.choice([0, 0, 0, 0, 1]),
        "error_rate": round(random.uniform(0.0, 1.5), 2),
        "response_time": round(random.uniform(0.05, 0.45), 3),
        "recent_deployment": random.choice([0, 0, 1]),
        "pod_status": "Running",
        "deployment_status": "Healthy",
        "log_error_count": random.randint(0, 2),
        "event_count": random.randint(0, 3),
        "health_status": "Healthy",
        "failure_type": "Normal",
        "failure_label": 0
    }

def generate_crashloop_sample(base_time):
    return {
        "timestamp": base_time.isoformat(),
        "cpu_usage": round(random.uniform(10.0, 45.0), 2),
        "memory_usage": round(random.uniform(25.0, 65.0), 2),
        "restart_count": random.randint(3, 15),
        "error_rate": round(random.uniform(30.0, 100.0), 2),
        "response_time": round(random.uniform(2.5, 8.0), 3),
        "recent_deployment": random.choice([1, 1, 1, 0]),
        "pod_status": "CrashLoopBackOff",
        "deployment_status": "Degraded",
        "log_error_count": random.randint(10, 45),
        "event_count": random.randint(8, 25),
        "health_status": "Unhealthy",
        "failure_type": "CrashLoopBackOff",
        "failure_label": 1
    }

def generate_oom_sample(base_time):
    return {
        "timestamp": base_time.isoformat(),
        "cpu_usage": round(random.uniform(40.0, 85.0), 2),
        "memory_usage": round(random.uniform(92.0, 99.8), 2),
        "restart_count": random.randint(2, 8),
        "error_rate": round(random.uniform(15.0, 80.0), 2),
        "response_time": round(random.uniform(1.8, 6.0), 3),
        "recent_deployment": random.choice([0, 1]),
        "pod_status": "OOMKilled",
        "deployment_status": "Degraded",
        "log_error_count": random.randint(5, 20),
        "event_count": random.randint(6, 18),
        "health_status": "Unhealthy",
        "failure_type": "OOMKilled",
        "failure_label": 1
    }

def generate_high_cpu_sample(base_time):
    return {
        "timestamp": base_time.isoformat(),
        "cpu_usage": round(random.uniform(88.0, 99.5), 2),
        "memory_usage": round(random.uniform(40.0, 80.0), 2),
        "restart_count": random.randint(0, 3),
        "error_rate": round(random.uniform(8.0, 45.0), 2),
        "response_time": round(random.uniform(2.0, 5.5), 3),
        "recent_deployment": random.choice([0, 1]),
        "pod_status": "Running",
        "deployment_status": "Degraded",
        "log_error_count": random.randint(3, 15),
        "event_count": random.randint(4, 12),
        "health_status": "Degraded",
        "failure_type": "High CPU",
        "failure_label": 1
    }

def generate_failed_deployment_sample(base_time):
    return {
        "timestamp": base_time.isoformat(),
        "cpu_usage": round(random.uniform(10.0, 40.0), 2),
        "memory_usage": round(random.uniform(15.0, 50.0), 2),
        "restart_count": random.randint(0, 2),
        "error_rate": round(random.uniform(50.0, 100.0), 2),
        "response_time": round(random.uniform(3.0, 10.0), 3),
        "recent_deployment": 1,
        "pod_status": "ImagePullBackOff",
        "deployment_status": "Failed",
        "log_error_count": random.randint(8, 30),
        "event_count": random.randint(5, 20),
        "health_status": "Failed",
        "failure_type": "Failed deployment",
        "failure_label": 1
    }

def generate_app_health_failure_sample(base_time):
    return {
        "timestamp": base_time.isoformat(),
        "cpu_usage": round(random.uniform(30.0, 60.0), 2),
        "memory_usage": round(random.uniform(30.0, 60.0), 2),
        "restart_count": random.randint(1, 4),
        "error_rate": round(random.uniform(25.0, 75.0), 2),
        "response_time": round(random.uniform(2.5, 7.0), 3),
        "recent_deployment": random.choice([0, 1]),
        "pod_status": "Running",
        "deployment_status": "Degraded",
        "log_error_count": random.randint(12, 40),
        "event_count": random.randint(4, 15),
        "health_status": "Unhealthy",
        "failure_type": "Application health failure",
        "failure_label": 1
    }

def generate_config_error_sample(base_time):
    return {
        "timestamp": base_time.isoformat(),
        "cpu_usage": round(random.uniform(10.0, 35.0), 2),
        "memory_usage": round(random.uniform(15.0, 45.0), 2),
        "restart_count": random.randint(2, 6),
        "error_rate": round(random.uniform(60.0, 100.0), 2),
        "response_time": round(random.uniform(2.0, 6.0), 3),
        "recent_deployment": 1,
        "pod_status": "CreateContainerConfigError",
        "deployment_status": "Failed",
        "log_error_count": random.randint(6, 25),
        "event_count": random.randint(5, 16),
        "health_status": "Failed",
        "failure_type": "Configuration error",
        "failure_label": 1
    }

def generate_full_dataset(n_samples=2500):
    samples = []
    start_time = datetime.now() - timedelta(days=14)
    
    generators = [
        (generate_normal_sample, 0.45),              # 45% normal samples
        (generate_crashloop_sample, 0.15),           # 15% CrashLoopBackOff
        (generate_oom_sample, 0.10),                 # 10% OOMKilled
        (generate_high_cpu_sample, 0.10),            # 10% High CPU
        (generate_failed_deployment_sample, 0.08),   # 8% Failed deployment
        (generate_app_health_failure_sample, 0.06),  # 6% App health failure
        (generate_config_error_sample, 0.06)         # 6% Config error
    ]
    
    for i in range(n_samples):
        base_time = start_time + timedelta(minutes=i * 8)
        gen_choice = random.choices(
            [g[0] for g in generators],
            weights=[g[1] for g in generators],
            k=1
        )[0]
        samples.append(gen_choice(base_time))
        
    df = pd.DataFrame(samples)
    return df

if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(__file__), "dataset")
    os.makedirs(output_dir, exist_ok=True)
    
    df = generate_full_dataset(n_samples=2500)
    output_path = os.path.join(output_dir, "kubernetes_telemetry_dataset.csv")
    df.to_csv(output_path, index=False)
    
    print(f"[Dataset Generator] Successfully generated {len(df)} samples.")
    print(f"[Dataset Generator] Saved to: {output_path}")
    print("\nClass distribution:")
    print(df["failure_type"].value_counts())
    print("\nBinary label distribution (0=Normal, 1=Failure):")
    print(df["failure_label"].value_counts())
