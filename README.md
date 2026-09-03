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
**AI DevOps Copilot** is a practical, hybrid AI-powered platform for Kubernetes and CI/CD that closes the loop between **predictive failure detection**, **log-based root cause analysis (RCA)**, **safety-guarded remediation**, and **post-recovery verification**.

```
USER
 ↓
REACT WEB DASHBOARD (Port 5173)
 ↓
NODE.JS + EXPRESS BACKEND (Port 5000)
 ↓
GITHUB ──► JENKINS CI/CD ──► DOCKER BUILD ──► DOCKER REGISTRY
                                                     ↓
                                             KUBERNETES CLUSTER
                                                     ↓
                                            PROMETHEUS + LOGS
                                                     ↓
                                           FASTAPI AI SERVICE (Port 8000)
                                            (Random Forest + LLM Agent)
                                                     ↓
                                          SELF-HEALING CONTROLLER
                                          (Allow-list: Restart/Scale/Rollback)
                                                     ↓
                                             KUBERNETES API
                                                     ↓
                                            VERIFICATION & MTTR
```

---

## 🚀 Quick Start (Local Setup)

### Option 1: Docker Compose (All-in-One)
```bash
docker-compose up --build
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

### 1. Interactive Fault Injection
```bash
# Inject CrashLoopBackOff into demo workload
node scripts/inject_fault.js --type crashloop

# Inject Out-Of-Memory (OOMKilled)
node scripts/inject_fault.js --type oom

# Inject High CPU compute loop
node scripts/inject_fault.js --type cpu

# Reset workload state
node scripts/inject_fault.js --type reset
```

### 2. End-to-End Autonomous Self-Healing Demo
```bash
node scripts/run_e2e_demo.js
```

---

## 📊 Research Metrics & Evaluation Summary
* **ML Model Accuracy:** **96.8%**
* **ML Model F1-Score:** **96.8%**
* **False Positive Rate:** **2.4%**
* **Mean Time to Recover (MTTR):** **~12–18 seconds** (vs. 15–25 minutes manual remediation, a **~98% reduction**)
* **Safety Violations:** **0** (Enforced by strict allow-lists, 60s cooldowns, and retry limits).

---

## 📚 Project Documentation
* [Project Synopsis](docs/PROJECT_SYNOPSIS.md)
* [High-Level System Design (HLD)](docs/HLD_System_Design.md)
* [Low-Level System Design (LLD)](docs/LLD_System_Design.md)
* [Research Evaluation & Benchmark](docs/RESEARCH_EVALUATION.md)
* [Phase 1 PPT Deck Outline](docs/PHASE1_PPT_OUTLINE.md)
* [Viva Defense Q&A Guide](docs/VIVA_DEFENSE_QA.md)
* [Weekly Progress Log](docs/weekly-progress-log.md)
