import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ServicesAPI, DeploymentsAPI, RecoveryAPI } from '../api/endpoints';
import Sidebar from '../components/Sidebar/Sidebar';
import AIInsightsPanel from '../components/AIInsights/AIInsightsPanel';
import IncidentList from '../components/Incidents/IncidentList';
import DeploymentStatusList from '../components/DeploymentStatus/DeploymentStatusList';
import MetricsChartPanel from '../components/Monitoring/MetricsChartPanel';
import SLOPanel from '../components/Monitoring/SLOPanel';
import RepoImportForm from '../components/RepoImport/RepoImportForm';
import SelfHealingPanel from '../components/SelfHealing/SelfHealingPanel';
import SettingsPanel from '../components/Settings/SettingsPanel';

const metric = (label, value, detail, state = 'neutral') => ({ label, value, detail, state });
const safeCount = (value) => Array.isArray(value) ? value.length : null;

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState(null);
  const [deployments, setDeployments] = useState(null);
  const [recoveries, setRecoveries] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);

  const refresh = useCallback(async () => {
    const [serviceResult, deploymentResult, recoveryResult] = await Promise.allSettled([ServicesAPI.list(), DeploymentsAPI.list(), RecoveryAPI.list()]);
    setServices(serviceResult.status === 'fulfilled' ? serviceResult.value.data : null);
    setDeployments(deploymentResult.status === 'fulfilled' ? deploymentResult.value.data : null);
    setRecoveries(recoveryResult.status === 'fulfilled' ? recoveryResult.value.data : null);
    setUpdatedAt(new Date()); setRefreshKey((key) => key + 1);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const selectedService = useMemo(() => Array.isArray(services) ? services.find((service) => service.deploymentName) || services[0] : null, [services]);
  const cards = [
    metric('Registered services', services === null ? '—' : safeCount(services), services === null ? 'Service inventory unavailable' : 'From service registry'),
    metric('Recent deployments', deployments === null ? '—' : safeCount(deployments), deployments === null ? 'Deployment history unavailable' : 'From deployment audit'),
    metric('Recovery actions', recoveries === null ? '—' : safeCount(recoveries), recoveries === null ? 'Recovery audit unavailable' : 'From controlled recovery history'),
    metric('Copilot target', selectedService?.deploymentName || 'Unavailable', selectedService ? `Namespace: ${selectedService.namespace || 'Unavailable'}` : 'No registered deployment target', selectedService ? 'ai' : 'neutral'),
  ];
  const overview = <>
    <AIInsightsPanel service={selectedService} refreshKey={refreshKey} />
    <div className="dashboard-split"><IncidentList refreshKey={refreshKey} compact /><DeploymentStatusList refreshKey={refreshKey} /></div>
    <MetricsChartPanel refreshKey={refreshKey} />
  </>;
  const content = {
    dashboard: overview,
    services: <div className="dashboard-split"><RepoImportForm services={services || []} onServiceCreated={refresh} onDeploymentTriggered={refresh} /><SLOPanel refreshKey={refreshKey} /></div>,
    deployments: <DeploymentStatusList refreshKey={refreshKey} />,
    incidents: <IncidentList refreshKey={refreshKey} />,
    logs: <div className="unavailable-page">Live logs require a selected pod through the existing observability endpoint. No generic log stream is available from the current API.</div>,
    metrics: <><MetricsChartPanel refreshKey={refreshKey} /><SLOPanel refreshKey={refreshKey} /></>,
    'ai-copilot': <AIInsightsPanel service={selectedService} refreshKey={refreshKey} />,
    predictions: <AIInsightsPanel service={selectedService} refreshKey={refreshKey} />,
    rca: <AIInsightsPanel service={selectedService} refreshKey={refreshKey} />,
    recovery: <SelfHealingPanel refreshKey={refreshKey} />,
    'audit-trail': <><IncidentList refreshKey={refreshKey} /><SelfHealingPanel refreshKey={refreshKey} /></>,
    settings: <SettingsPanel />,
  };
  return <div className="app-container"><Sidebar activeTab={activeTab} onSelectTab={setActiveTab} /><main className="app-main"><header className="operations-header"><div><div className="eyebrow">Operations workspace</div><h1>DevOps control plane</h1><p>Live state is displayed only when supplied by the connected control-plane APIs.</p></div><div className="header-actions"><span className="last-updated">{updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : 'Not yet loaded'}</span><button className="btn btn-secondary" onClick={refresh}>Refresh data</button></div></header><div className="workspace-container"><section className="metric-strip">{cards.map((card) => <article className={`metric-card metric-${card.state}`} key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.detail}</small></article>)}</section>{content[activeTab] || overview}</div></main></div>;
};
export default DashboardPage;
