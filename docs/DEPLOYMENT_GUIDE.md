# PRODUCTION & CLUSTER DEPLOYMENT GUIDE

**Project Title:** AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing  
**Institution:** The National Institute of Engineering, Department of Computer Science & Engineering  
**Guide:** Mrs. Sneha S, Assistant Professor  

---

## 1. Local Multi-Container Deployment (Docker Compose)

The fastest way to spin up the entire system with all 6 interconnected services:

```bash
# 1. Start all containers in background
docker compose up -d --build

# 2. Check running container health
docker ps

# 3. View live microservice logs
docker compose logs -f backend ai-service
```

### Access URLs:
- **React Observability Dashboard:** `http://localhost:5173`
- **Node.js Express Backend:** `http://localhost:5000`
- **FastAPI AI Swagger Docs:** `http://localhost:8000/docs`
- **Prometheus UI:** `http://localhost:9090`
- **Demo Target Microservice:** `http://localhost:3000/health`

---

## 2. Kubernetes Cluster Deployment (Minikube / Docker Desktop / Kind)

### Step 1: Enable Kubernetes
- **Docker Desktop:** Settings $\rightarrow$ Kubernetes $\rightarrow$ Check *Enable Kubernetes* $\rightarrow$ Apply & Restart.
- **Minikube:** Run `minikube start --driver=docker`.

### Step 2: One-Click Cluster Provisioning
```powershell
# Windows PowerShell:
.\scripts\deploy_k8s.ps1

# Linux / Mac Bash:
chmod +x scripts/deploy_k8s.sh
./scripts/deploy_k8s.sh
```

### Step 3: Verify Running Pods
```bash
kubectl get pods -n devops-copilot -o wide
```

---

## 3. Jenkins CI/CD Pipeline Setup

1. **Install Jenkins:** Run on port `8080` (or via `docker run -p 8080:8080 jenkins/jenkins:lts`).
2. **Add Credentials:**
   - In Jenkins Dashboard $\rightarrow$ Manage Jenkins $\rightarrow$ Credentials $\rightarrow$ Add `docker-hub-credentials` (Username & Password/Token).
3. **Create Pipeline Job:**
   - Name: `ai-devops-copilot-pipeline`
   - Type: **Pipeline**
   - Pipeline Definition: **Pipeline script from SCM** $\rightarrow$ Git $\rightarrow$ Repo: `https://github.com/devops-copilot-d4/devops-copilot.git`
   - Script Path: `jenkins/Jenkinsfile`
4. **Trigger Build:** Click **Build Now** to execute the full 8-stage automated workflow.

---

## 4. Cloud / AWS Deployment (Optional Production Target)

If deploying to AWS:
1. **Compute:** Single AWS EC2 instance (`t3.large` with Ubuntu 24.04 LTS and Docker + Minikube installed).
2. **Security Groups:** Inbound TCP ports: `5173` (Frontend), `5000` (Backend API), `8000` (AI Service), `9090` (Prometheus).
3. **Environment Variables:** Update `.env` with AWS public IP / Elastic IP.
