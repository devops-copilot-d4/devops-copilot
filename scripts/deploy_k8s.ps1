# One-Click Kubernetes Deployment Script for AI DevOps Copilot (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " AI DEVOPS COPILOT - KUBERNETES DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "Error: kubectl command not found. Ensure Docker Desktop Kubernetes or Minikube is installed." -ForegroundColor Red
    Exit 1
}

# 2. Create namespace and apply RBAC
Write-Host "`n[1/4] Applying Least-Privilege RBAC & Namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/rbac.yaml

# 3. Deploy Prometheus Telemetry Gateway
Write-Host "`n[2/4] Deploying Prometheus Telemetry & Scrape Configs..." -ForegroundColor Yellow
kubectl apply -f k8s/prometheus/prometheus-config.yaml -n devops-copilot
kubectl apply -f k8s/prometheus/prometheus-deployment.yaml -n devops-copilot

# 4. Deploy Sample Microservice Application
Write-Host "`n[3/4] Deploying Target Application Workload (demo-checkout-service)..." -ForegroundColor Yellow
kubectl apply -f k8s/app-deployment.yaml -n devops-copilot

# 5. Verify Rollout Status
Write-Host "`n[4/4] Verifying Cluster Rollout Status..." -ForegroundColor Yellow
kubectl rollout status deployment/demo-checkout-service -n devops-copilot --timeout=60s

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Active Pods in devops-copilot namespace:" -ForegroundColor Cyan
kubectl get pods -n devops-copilot
