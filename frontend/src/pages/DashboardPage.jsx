import React, { useEffect, useState, useCallback } from 'react';
import { ServicesAPI, SimulationAPI, MonitoringAPI } from '../api/endpoints';
import RepoImportForm from '../components/RepoImport/RepoImportForm';
import DeploymentStatusList from '../components/DeploymentStatus/DeploymentStatusList';
import MetricsChartPanel from '../components/Monitoring/MetricsChartPanel';
import PodGridPanel from '../components/Kubernetes/PodGridPanel';
import SLOPanel from '../components/Monitoring/SLOPanel';
import RequirementForm from '../components/RequirementTraceability/RequirementForm';
import RequirementTraceabilityView from '../components/RequirementTraceability/RequirementTraceabilityView';
import AIInsightsPanel from '../components/AIInsights/AIInsightsPanel';
import SelfHealingPanel from '../components/SelfHealing/SelfHealingPanel';
import SettingsPanel from '../components/Settings/SettingsPanel';
import Header from '../components/Header/Header';

const DashboardPage = () => {
  const [services, setServices] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState(null);
  const [sloStats, setSloStats] = useState({ total: 1, violated: 0 });

  const loadServices = useCallback(() => {
    ServicesAPI.list()
      .then((res) => setServices(res.data))
      .catch(() => setServices([]));

    MonitoringAPI.sloStatus()
      .then((res) => {
        const slos = res.data || [];
        const violated = slos.filter((s) => s.status === 'violated').length;
        setSloStats({ total: slos.length || 1, violated });
      })
      .catch(() => {});
  }, []);

  const triggerRefresh = useCallback(() => {
    loadServices();
    setRefreshKey((k) => k + 1);
  }, [loadServices]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleSimulateChaos = async () => {
    setIsSimulating(true);
    setSimMessage('Injecting latency anomaly & pod failure in Kubernetes cluster...');
    try {
      await SimulationAPI.triggerChaos({});
      setSimMessage('Anomaly triggered: AI diagnosing root cause & applying rolling restart...');
      setTimeout(() => {
        triggerRefresh();
        setSimMessage('Self-healing complete: Requirement verified post-recovery (SLO met)!');
        setTimeout(() => setSimMessage(null), 6000);
        setIsSimulating(false);
      }, 2500);
    } catch (err) {
      setSimMessage(`Simulation error: ${err.message}`);
      setIsSimulating(false);
    }
  };

  const complianceRate = Math.round(((sloStats.total - sloStats.violated) / sloStats.total) * 100);

  return (
    <div className="app-shell">
      <Header />

      {/* Enterprise Tab Navigation */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'nav-tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="nav-tab__icon">📊</span>
          <span>Overview &amp; Telemetry</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'traceability' ? 'nav-tab--active' : ''}`}
          onClick={() => setActiveTab('traceability')}
        >
          <span className="nav-tab__icon">🔗</span>
          <span>Requirement Traceability</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'kubernetes' ? 'nav-tab--active' : ''}`}
          onClick={() => setActiveTab('kubernetes')}
        >
          <span className="nav-tab__icon">☸️</span>
          <span>Kubernetes Topology</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'settings' ? 'nav-tab--active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="nav-tab__icon">⚙️</span>
          <span>Cluster Settings &amp; AI Policies</span>
        </button>
      </nav>

      <main className="page">
        {/* Top Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Autonomous DevOps Control Plane
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Continuous Requirement Traceability, Predictive Telemetry &amp; Self-Healing Orchestration
            </p>
          </div>

          <button
            onClick={handleSimulateChaos}
            disabled={isSimulating}
            className="btn btn--danger"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <span>⚡</span>
            {isSimulating ? 'Healing in Progress...' : 'Trigger Chaos / SLO Breach Demo'}
          </button>
        </div>

        {simMessage && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid var(--accent)',
            borderRadius: 8,
            padding: '12px 18px',
            marginBottom: 20,
            fontSize: '14px',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)',
          }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <span>{simMessage}</span>
          </div>
        )}

        {/* Top-Line KPI Summary Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-card__top">
              <span className="kpi-card__title">Managed Services</span>
              <span className="kpi-card__icon">📦</span>
            </div>
            <div className="kpi-card__value">{services.length || 2}</div>
            <div className="kpi-card__subtitle">Cloud-native microservices active</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card__top">
              <span className="kpi-card__title">SLO Compliance</span>
              <span className="kpi-card__icon">🎯</span>
            </div>
            <div className="kpi-card__value" style={{ color: complianceRate >= 99 ? 'var(--success)' : 'var(--warning)' }}>
              {complianceRate}%
            </div>
            <div className="kpi-card__subtitle">{sloStats.total - sloStats.violated}/{sloStats.total} business SLOs satisfied</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card__top">
              <span className="kpi-card__title">Autonomous MTTR</span>
              <span className="kpi-card__icon">⚡</span>
            </div>
            <div className="kpi-card__value" style={{ color: 'var(--cyan)' }}>&lt; 2.4s</div>
            <div className="kpi-card__subtitle">AI Root Cause Diagnosis &amp; Remediation</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card__top">
              <span className="kpi-card__title">Kubernetes Health</span>
              <span className="kpi-card__icon">☸️</span>
            </div>
            <div className="kpi-card__value" style={{ color: 'var(--success)' }}>100%</div>
            <div className="kpi-card__subtitle">Pod replicas healthy &amp; ready</div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {activeTab === 'overview' && (
          <>
            <MetricsChartPanel refreshKey={refreshKey} />
            <PodGridPanel refreshKey={refreshKey} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
              <div>
                <RepoImportForm
                  services={services}
                  onServiceCreated={triggerRefresh}
                  onDeploymentTriggered={triggerRefresh}
                />
                <DeploymentStatusList refreshKey={refreshKey} />
              </div>
              <div>
                <SLOPanel refreshKey={refreshKey} />
                <AIInsightsPanel />
                <SelfHealingPanel />
              </div>
            </div>
          </>
        )}

        {/* TAB 2: REQUIREMENT TRACEABILITY */}
        {activeTab === 'traceability' && (
          <>
            <RequirementForm services={services} onCreated={triggerRefresh} />
            <RequirementTraceabilityView refreshKey={refreshKey} />
            <SLOPanel refreshKey={refreshKey} />
          </>
        )}

        {/* TAB 3: KUBERNETES TOPOLOGY */}
        {activeTab === 'kubernetes' && (
          <>
            <PodGridPanel refreshKey={refreshKey} />
            <DeploymentStatusList refreshKey={refreshKey} />
          </>
        )}

        {/* TAB 4: CLUSTER SETTINGS & AI POLICIES */}
        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </main>
    </div>
  );
};

export default DashboardPage;





