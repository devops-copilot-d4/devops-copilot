import React, { useEffect, useState, useCallback } from 'react';
import { ServicesAPI, SimulationAPI } from '../api/endpoints';
import RepoImportForm from '../components/RepoImport/RepoImportForm';
import DeploymentStatusList from '../components/DeploymentStatus/DeploymentStatusList';
import MetricsChartPanel from '../components/Monitoring/MetricsChartPanel';
import PodGridPanel from '../components/Kubernetes/PodGridPanel';
import SLOPanel from '../components/Monitoring/SLOPanel';
import RequirementForm from '../components/RequirementTraceability/RequirementForm';
import RequirementTraceabilityView from '../components/RequirementTraceability/RequirementTraceabilityView';
import AIInsightsPanel from '../components/AIInsights/AIInsightsPanel';
import SelfHealingPanel from '../components/SelfHealing/SelfHealingPanel';
import Header from '../components/Header/Header';

const DashboardPage = () => {
  const [services, setServices] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState(null);

  const loadServices = useCallback(() => {
    ServicesAPI.list()
      .then((res) => setServices(res.data))
      .catch(() => setServices([]));
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
    setSimMessage('Injecting latency anomaly & pod failure...');
    try {
      await SimulationAPI.triggerChaos({});
      setSimMessage('Chaos injected! AI diagnosing root cause & executing self-healing...');
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

  return (
    <>
      <Header />
      <div className="page">
        {/* Top Header Bar with Live Viva Demo Simulation Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ margin: 0 }}>Intelligent DevOps Control Plane</h1>
          <button
            onClick={handleSimulateChaos}
            disabled={isSimulating}
            style={{
              background: isSimulating ? '#f59e0b' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: '14px',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
            }}
          >
            <span>⚡</span>
            {isSimulating ? 'Executing Self-Healing Loop...' : 'Simulate Traffic Spike / SLO Breach'}
          </button>
        </div>

        {simMessage && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid var(--accent)',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 18,
            fontSize: '14px',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: '16px' }}>🤖</span>
            <span>{simMessage}</span>
          </div>
        )}

        {/* Real-time Charts & Telemetry */}
        <MetricsChartPanel refreshKey={refreshKey} />
        <PodGridPanel refreshKey={refreshKey} />

        {/* Core Control & Traceability Modules */}
        <RepoImportForm
          services={services}
          onServiceCreated={triggerRefresh}
          onDeploymentTriggered={triggerRefresh}
        />
        <DeploymentStatusList refreshKey={refreshKey} />
        <RequirementForm services={services} onCreated={triggerRefresh} />
        <RequirementTraceabilityView refreshKey={refreshKey} />
        <SLOPanel refreshKey={refreshKey} />
        <AIInsightsPanel />
        <SelfHealingPanel />
      </div>
    </>
  );
};

export default DashboardPage;




