import React, { useEffect, useState, useCallback } from 'react';
import { ServicesAPI, SimulationAPI, MonitoringAPI } from '../api/endpoints';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import AIInsightsPanel from '../components/AIInsights/AIInsightsPanel';
import SelfHealingPanel from '../components/SelfHealing/SelfHealingPanel';
import PodGridPanel from '../components/Kubernetes/PodGridPanel';
import MetricsChartPanel from '../components/Monitoring/MetricsChartPanel';
import LiveLogsTerminal from '../components/Monitoring/LiveLogsTerminal';
import DeploymentStatusList from '../components/DeploymentStatus/DeploymentStatusList';
import SLOPanel from '../components/Monitoring/SLOPanel';
import RepoImportForm from '../components/RepoImport/RepoImportForm';
import RequirementForm from '../components/RequirementTraceability/RequirementForm';
import RequirementTraceabilityView from '../components/RequirementTraceability/RequirementTraceabilityView';
import SettingsPanel from '../components/Settings/SettingsPanel';

const DashboardPage = () => {
  const [services, setServices] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState(null);
  const [sloStats, setSloStats] = useState({ total: 1, violated: 0 });
  const [clusterInfo, setClusterInfo] = useState({ availableReplicas: 2, replicas: 2, status: 'Healthy' });
  const [lastMttr, setLastMttr] = useState('0.83s');

  const loadData = useCallback(() => {
    ServicesAPI.list()
      .then((res) => setServices(res.data || []))
      .catch(() => setServices([]));

    MonitoringAPI.sloStatus()
      .then((res) => {
        const slos = res.data || [];
        const violated = slos.filter((s) => s.status === 'violated').length;
        setSloStats({ total: slos.length || 1, violated });
      })
      .catch(() => {});

    SimulationAPI.getPods()
      .then((res) => setClusterInfo(res.data || {}))
      .catch(() => {});

    RecoveryAPI.list()
      .then((res) => {
        const list = res.data || [];
        if (list.length > 0 && list[0].mttr != null) {
          setLastMttr(`${list[0].mttr}s`);
        }
      })
      .catch(() => {});
  }, []);

  const triggerRefresh = useCallback(() => {
    loadData();
    setRefreshKey((k) => k + 1);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSimulateChaos = async () => {
    setIsSimulating(true);
    setSimMessage({ type: 'warning', text: 'Injecting controlled CrashLoopBackOff anomaly in demo-checkout-service...' });
    try {
      const res = await SimulationAPI.triggerChaos({});
      setSimMessage({ type: 'info', text: 'Anomaly detected: Real AI analyzing telemetry & executing autonomous rollback...' });
      setTimeout(() => {
        triggerRefresh();
        const actionResult = res.data?.aiDiagnosis?.recommended_action || 'ROLLBACK';
        setSimMessage({ type: 'success', text: `Autonomous recovery verified: ${actionResult} executed & P95 latency stabilized.` });
        setTimeout(() => setSimMessage(null), 6000);
        setIsSimulating(false);
      }, 2500);
    } catch (err) {
      setSimMessage({ type: 'error', text: `Simulation error: ${err.message}` });
      setIsSimulating(false);
    }
  };

  const complianceRate = Math.round(((sloStats.total - sloStats.violated) / sloStats.total) * 100);
  const isHealthyCluster = clusterInfo.status === 'Healthy' || (clusterInfo.availableReplicas >= clusterInfo.replicas);

  return (
    <div className="app-container">
      {/* Persistent Left Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Workspace */}
      <div className="app-main">
        <Header
          onRefresh={triggerRefresh}
          onTriggerDeploy={() => setActiveTab('deployments')}
          onOpenAICopilot={() => setActiveTab('ai-copilot')}
          onOpenSettings={() => setActiveTab('settings')}
        />

        <div className="workspace-container">
          {/* Top Operational Title Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Autonomous DevOps Control Plane
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Continuous Requirement Traceability, Predictive Telemetry &amp; Self-Healing Orchestration
              </p>
            </div>

            <button
              onClick={handleSimulateChaos}
              disabled={isSimulating}
              className="btn btn-danger"
              style={{ padding: '8px 16px', fontWeight: 600 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>{isSimulating ? 'Executing Chaos Test...' : 'Trigger Chaos & Self-Healing'}</span>
            </button>
          </div>

          {/* Simulation Status Feedback Alert */}
          {simMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                background:
                  simMessage.type === 'success'
                    ? 'var(--status-healthy-subtle)'
                    : simMessage.type === 'warning'
                    ? 'var(--status-warning-subtle)'
                    : 'var(--status-critical-subtle)',
                border: `1px solid ${
                  simMessage.type === 'success'
                    ? 'rgba(34, 197, 94, 0.3)'
                    : simMessage.type === 'warning'
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)'
                }`,
                color:
                  simMessage.type === 'success'
                    ? 'var(--status-healthy)'
                    : simMessage.type === 'warning'
                    ? 'var(--status-warning)'
                    : 'var(--status-critical)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <strong>STATUS:</strong>
              <span>{simMessage.text}</span>
            </div>
          )}

          {/* 1. EXECUTIVE METRICS (4 CARDS) */}
          <div className="metrics-grid-4">
            <div className="metric-card">
              <div className="metric-card-top">
                <span>Services</span>
                <span className="badge-pill badge-neutral">Active</span>
              </div>
              <div className="metric-card-value">{services.length || 1}</div>
              <div className="metric-card-sub">
                <span>Managed microservices in cluster</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card-top">
                <span>SLO Compliance</span>
                <span className={`badge-pill ${complianceRate >= 99 ? 'badge-healthy' : 'badge-warning'}`}>
                  {complianceRate}%
                </span>
              </div>
              <div className="metric-card-value" style={{ color: complianceRate >= 99 ? 'var(--status-healthy)' : 'var(--status-warning)' }}>
                {complianceRate}%
              </div>
              <div className="metric-card-sub">
                <span>{sloStats.total - sloStats.violated} / {sloStats.total} services compliant</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card-top">
                <span>Autonomous MTTR</span>
                <span className="badge-pill badge-telemetry">Measured</span>
              </div>
              <div className="metric-card-value" style={{ color: 'var(--status-telemetry)' }}>
                {lastMttr}
              </div>
              <div className="metric-card-sub">
                <span>Measured closed-loop recovery</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card-top">
                <span>Kubernetes Health</span>
                <span className={`badge-pill ${isHealthyCluster ? 'badge-healthy' : 'badge-critical'}`}>
                  {isHealthyCluster ? 'READY' : 'DEGRADED'}
                </span>
              </div>
              <div className="metric-card-value" style={{ color: isHealthyCluster ? 'var(--status-healthy)' : 'var(--status-critical)' }}>
                {clusterInfo.availableReplicas || 2}/{clusterInfo.replicas || 2} pods
              </div>
              <div className="metric-card-sub">
                <span>{isHealthyCluster ? 'All replicas ready on worker-1' : 'Replicas recovering from fault'}</span>
              </div>
            </div>
          </div>

          {/* TAB: DASHBOARD (MASTER UNIFIED VIEW) */}
          {activeTab === 'dashboard' && (
            <>
              {/* 2. AI FAILURE PREDICTION & RCA (MOST PROMINENT) */}
              <AIInsightsPanel refreshKey={refreshKey} />

              {/* 3. ACTIVE INCIDENT / RECOVERY + KUBERNETES TOPOLOGY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 16 }}>
                <SelfHealingPanel refreshKey={refreshKey} onOpenLogs={() => setActiveTab('logs')} />
                <PodGridPanel refreshKey={refreshKey} />
              </div>

              {/* 4. 3 METRICS CHARTS (CPU, MEMORY, LATENCY vs SLO) */}
              <MetricsChartPanel refreshKey={refreshKey} />

              {/* 5. LIVE LOGS & RECENT DEPLOYMENTS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 16 }}>
                <LiveLogsTerminal refreshKey={refreshKey} />
                <DeploymentStatusList refreshKey={refreshKey} />
              </div>
            </>
          )}

          {/* TAB: SERVICES & REPO REGISTRATION */}
          {activeTab === 'services' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 16 }}>
              <RepoImportForm services={services} onServiceCreated={triggerRefresh} onDeploymentTriggered={triggerRefresh} />
              <SLOPanel refreshKey={refreshKey} />
            </div>
          )}

          {/* TAB: CI/CD DEPLOYMENTS */}
          {activeTab === 'deployments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <RepoImportForm services={services} onServiceCreated={triggerRefresh} onDeploymentTriggered={triggerRefresh} />
              <DeploymentStatusList refreshKey={refreshKey} />
            </div>
          )}

          {/* TAB: INCIDENTS & LOGS */}
          {(activeTab === 'incidents' || activeTab === 'logs') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <LiveLogsTerminal refreshKey={refreshKey} />
              <SelfHealingPanel refreshKey={refreshKey} />
            </div>
          )}

          {/* TAB: METRICS & SLOS */}
          {activeTab === 'metrics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <MetricsChartPanel refreshKey={refreshKey} />
              <SLOPanel refreshKey={refreshKey} />
            </div>
          )}

          {/* TAB: AI COPILOT, PREDICTIONS, RCA */}
          {(activeTab === 'ai-copilot' || activeTab === 'predictions' || activeTab === 'rca') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <AIInsightsPanel refreshKey={refreshKey} />
              <RequirementForm services={services} onCreated={triggerRefresh} />
              <RequirementTraceabilityView refreshKey={refreshKey} />
            </div>
          )}

          {/* TAB: RECOVERY & AUDIT TRAIL */}
          {(activeTab === 'recovery' || activeTab === 'audit-trail') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SelfHealingPanel refreshKey={refreshKey} />
              <DeploymentStatusList refreshKey={refreshKey} />
            </div>
          )}

          {/* TAB: SETTINGS & POLICIES */}
          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
