#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " AI DEVOPS COPILOT - KUBERNETES DEPLOYMENT SCRIPT"
echo "=========================================================="

if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl command not found. Ensure Kubernetes cluster is accessible."
    exit 1
fi

echo -e "\n[1/4] Applying Least-Privilege RBAC & Namespace..."
kubectl apply -f k8s/rbac.yaml

echo -e "\n[2/4] Deploying Prometheus Telemetry Gateway..."
kubectl apply -f k8s/prometheus/prometheus-config.yaml -n devops-copilot
kubectl apply -f k8s/prometheus/prometheus-deployment.yaml -n devops-copilot

echo -e "\n[3/4] Deploying Target Application Workload..."
kubectl apply -f k8s/app-deployment.yaml -n devops-copilot

echo -e "\n[4/4] Verifying Cluster Rollout Status..."
kubectl rollout status deployment/demo-checkout-service -n devops-copilot --timeout=60s

echo -e "\n=========================================================="
echo " DEPLOYMENT SUCCESSFUL!"
echo "=========================================================="
kubectl get pods -n devops-copilot
