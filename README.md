# AI DevOps Copilot

> **Official Project Title:** AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing  
> **Institution:** The National Institute of Engineering, Department of Computer Science & Engineering  
> **Guide:** Mrs. Sneha S, Assistant Professor  
> **Team (Batch D4):**
> 1. **4NI23CS230 – Tharun Gowda K** (*Backend, CI/CD, Project Coordination*)
> 2. **4NI23CS244 – Vikas S** (*Kubernetes, Self-Healing Controller*)
> 3. **4NI23CS249 – Vishnu M** (*ML Model, AI/LLM Diagnostic Agent*)
> 4. **4NI23CS253 – Yashwanth P** (*Frontend Dashboard, Monitoring Integration*)

---

## 📌 Project Overview
**AI DevOps Copilot** is an integrated predictive and diagnostic DevOps control loop that combines **supervised failure prediction (Random Forest)**, **contextual AI-based root cause analysis (LLM RCA)**, **deterministic safety guardrails**, **Kubernetes remediation**, and **post-recovery closed-loop verification**.

```
USER
 ↓
REACT WEB DASHBOARD (Port 5173)
 ↓
NODE.JS + EXPRESS CONTROL PLANE (Port 5000)
 ├── MongoDB (Audit & Telemetry)
 ├── GitHub Actions (CI/CD Pipeline)
 ├── Kubernetes API (Workload Orchestration)
 ├── Prometheus (Time-Series Metrics)
 └── FASTAPI AI MICROSERVICE (Port 8000)
         ├── Random Forest Failure Predictor (POST /predict)
         └── LLM Contextual RCA & Decision Reasoner (POST /copilot/analyze)
```

### The Autonomous Control Loop
```
Kubernetes Workload 
       ↓ Telemetry (CPU, Memory, Restarts, Error Rate, Pod Phase)
Prometheus & Log Collector
       ↓ Telemetry + Log Context
Node.js Control Plane
       ↓ POST /copilot/analyze
FastAPI AI Service
       ├─► Random Forest: Failure Probability & Failure Type (CrashLoopBackOff)
       └─► LLM Agent: Root Cause & Action Recommendation (ROLLBACK, 91% Confidence)
Node.js Control Plane
       ↓
Deterministic Safety Guard (Allow-list, Namespace, 60s Cooldown, Max 2 Retries)
       ↓ Approved
Recovery Service
       ↓
Kubernetes API (Rollback / Restart / Scale)
       ↓
Closed-Loop Verification (2/2 Pods Ready & SLO Restored)
       ↓
MongoDB Audit Persistence & Real-Time Socket.IO Updates
       ↓
React Enterprise Dashboard
```

---

## 🚀 Quick Start (Local Setup)

### Option 1: Docker Compose (All-in-One)
```bash
docker compose up --build
```
* **React Dashboard:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:5000](http://localhost:5000)
* **FastAPI AI Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Prometheus:** [http://localhost:9090](http://localhost:9090)

### Option 2: Step-by-Step Local Run

#### 1. FastAPI AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
python main.py
# Running on http://localhost:8000
```

#### 2. Node.js Backend API
```bash
cd backend
npm install
npm start
# Running on http://localhost:5000
```

#### 3. React Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Running Chaos & Self-Healing Demonstrations

### 1. Interactive Web Dashboard Demo
1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Click **"Trigger Chaos & Self-Healing"**.
3. Watch the real-time closed-loop transition:
   $$\text{INCIDENT DETECTED} \longrightarrow \text{AI DIAGNOSIS (98\% HIGH, ROLLBACK 91\%)} \longrightarrow \text{AUTONOMOUS RECOVERY} \longrightarrow \text{SYSTEM OPERATIONAL (Verified)}$$

### 2. Standalone End-to-End CLI Demo
```bash
node scripts/run_e2e_demo.js
```

---

## 📊 Research Metrics & Evaluation Summary
* **Supervised ML Model:** Random Forest Classifier trained on multidimensional operational telemetry.
* **Failure Prediction Accuracy:** **96.8%** (F1-Score: **96.8%**, False Positive Rate: **2.4%**).
* **AI RCA Confidence:** **91%** on verified CrashLoopBackOff vectors.
* **Mean Time to Recovery (MTTR):** **~0.83s – 15s** autonomous closed-loop resolution (vs. 15–25 minutes manual human triaging).
* **Deterministic Safety:** Zero unsafe out-of-bounds operations (enforced by Action Allow-Lists, Namespace Isolation, Cooldowns, and Retry Caps).

---

## 📚 Project Documentation
* [High-Level System Design (HLD)](docs/HLD_System_Design.md)
* [Low-Level System Design (LLD)](docs/LLD_System_Design.md)
* [Project Synopsis](docs/PROJECT_SYNOPSIS.md)
* [Research Evaluation & Benchmark](docs/RESEARCH_EVALUATION.md)
* [Viva Defense Q&A Guide](docs/VIVA_DEFENSE_QA.md)
* [Deployment & Setup Guide](docs/DEPLOYMENT_GUIDE.md)
