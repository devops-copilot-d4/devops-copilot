#!/usr/bin/env python3
"""Generate reproducible synthetic pre-failure telemetry, not production data."""
from pathlib import Path
import numpy as np
import pandas as pd
from features import FEATURES, FAILURE_CLASSES

SEED = 20260906
DEFAULT_SAMPLES = 3500
CLASS_WEIGHTS = np.array([0.40, 0.15, 0.10, 0.11, 0.08, 0.08, 0.08])
# Mean precursor signals; shared spread intentionally creates overlapping classes.
PROFILES = {
    "Normal": (35, 42, 0.4, 1.0, 0.25, 0.18, 1.0, 1.5),
    "CrashLoopBackOff": (48, 48, 4.0, 16, 1.4, 0.70, 7.0, 7.0),
    "OOMKilled": (58, 77, 2.8, 10, 1.0, 0.48, 4.5, 5.0),
    "High CPU": (76, 55, 1.2, 7, 0.9, 0.42, 3.5, 4.0),
    "Failed deployment": (38, 43, 1.0, 14, 1.3, 0.82, 5.5, 6.0),
    "Application health failure": (51, 52, 2.1, 13, 1.2, 0.38, 6.0, 5.0),
    "Configuration error": (34, 39, 2.4, 15, 1.1, 0.78, 6.5, 6.5),
}
SPREAD = np.array([18, 18, 1.8, 8, 0.65, 0.35, 4.0, 4.0])

def generate_dataset(n_samples=DEFAULT_SAMPLES, seed=SEED):
    rng = np.random.default_rng(seed)
    labels = rng.choice(FAILURE_CLASSES, size=n_samples, p=CLASS_WEIGHTS)
    rows = []
    for label in labels:
        values = np.array(PROFILES[label], dtype=float) + rng.normal(0, SPREAD)
        values[0:2] = np.clip(values[0:2], 0, 100)
        values[2] = max(0, round(values[2]))
        values[3] = np.clip(values[3], 0, 100)
        values[4] = np.clip(values[4], 0.01, 12)
        values[5] = int(rng.random() < np.clip(values[5], 0.05, 0.95))
        values[6:8] = np.maximum(0, np.rint(values[6:8]))
        row = dict(zip(FEATURES, values))
        row["failure_type"] = label
        row["failure_label"] = int(label != "Normal")
        rows.append(row)
    return pd.DataFrame(rows)

def main():
    output = Path(__file__).parent / "dataset" / "synthetic_precursor_telemetry.csv"
    output.parent.mkdir(exist_ok=True)
    dataset = generate_dataset()
    dataset.to_csv(output, index=False)
    print(f"Generated {len(dataset)} synthetic precursor samples at {output}")

if __name__ == "__main__":
    main()
