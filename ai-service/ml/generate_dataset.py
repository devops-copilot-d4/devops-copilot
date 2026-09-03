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
        "cpu_usage": round(random.uniform(5.0, 25.0), 2),
        "memory_usage": round(random.uniform(15.0, 40.0), 2),
        "restart_count": random.randint(0, 2),
        "error_rate": round(random.uniform(50.0, 100.0), 2),
        "response_time": round(random.uniform(4.0, 10.0), 3),
        "recent_deployment": 1,
        "pod_status": "ImagePullBackOff",
        "deployment_status": "Failed",
        "log_error_count": random.randint(8, 30),
        "event_count": random.randint(6, 20),
        "health_status": "Unhealthy",
        "failure_type": "Failed deployment",
        "failure_label": 1
    }

def generate_health_failure_sample(base_time):
    return {
        "timestamp": base_time.isoformat(),
        "cpu_usage": round(random.uniform(25.0, 60.0), 2),
        "memory_usage": round(random.uniform(30.0, 70.0), 2),
        "restart_count": random.randint(1, 6),
        "error_rate": round(random.uniform(25.0, 85.0), 2),
        "response_time": round(random.uniform(1.5, 5.0), 3),
        "recent_deployment": random.choice([0, 1]),
        "pod_status": "Running",
        "deployment_status": "Degraded",
        "log_error_count": random.randint(12, 40),
        "event_count": random.randint(5, 15),
        "health_status": "Unhealthy",
        "failure_type": "Application health failure",
        "failure_label": 1
    }

def generate_config_error_sample(base_time):
    return {
        "timestamp": base_time.isoformat(),
        "cpu_usage": round(random.uniform(5.0, 20.0), 2),
        "memory_usage": round(random.uniform(10.0, 35.0), 2),
        "restart_count": random.randint(2, 10),
        "error_rate": round(random.uniform(80.0, 100.0), 2),
        "response_time": round(random.uniform(3.0, 9.0), 3),
        "recent_deployment": 1,
        "pod_status": "CreateContainerConfigError",
        "deployment_status": "Failed",
        "log_error_count": random.randint(15, 50),
        "event_count": random.randint(8, 22),
        "health_status": "Unhealthy",
        "failure_type": "Configuration error",
        "failure_label": 1
    }

def generate_full_dataset(n_samples=2500):
    base_time = datetime.now() - timedelta(days=7)
    records = []
    
    generators = [
        (generate_normal_sample, 0.40),
        (generate_crashloop_sample, 0.15),
        (generate_oom_sample, 0.12),
        (generate_high_cpu_sample, 0.11),
        (generate_failed_deployment_sample, 0.08),
        (generate_health_failure_sample, 0.07),
        (generate_config_error_sample, 0.07)
    ]
    
    for gen_fn, weight in generators:
        count = int(n_samples * weight)
        for i in range(count):
            sample_time = base_time + timedelta(minutes=random.randint(1, 10080))
            records.append(gen_fn(sample_time))
            
    df = pd.DataFrame(records)
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

if __name__ == "__main__":
    df = generate_full_dataset(2500)
    output_dir = os.path.join(os.path.dirname(__file__), "dataset")
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, "kubernetes_telemetry_dataset.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} samples saved to {out_path}")
