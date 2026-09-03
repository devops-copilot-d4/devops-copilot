import React, { useEffect, useState, useCallback } from 'react';
import { ServicesAPI } from '../api/endpoints';
import RepoImportForm from '../components/RepoImport/RepoImportForm';
import DeploymentStatusList from '../components/DeploymentStatus/DeploymentStatusList';
import SLOPanel from '../components/Monitoring/SLOPanel';
import RequirementForm from '../components/RequirementTraceability/RequirementForm';
import RequirementTraceabilityView from '../components/RequirementTraceability/RequirementTraceabilityView';
import AIInsightsPanel from '../components/AIInsights/AIInsightsPanel';
import SelfHealingPanel from '../components/SelfHealing/SelfHealingPanel';
import Header from '../components/Header/Header';

const DashboardPage = () => {
  const [services, setServices] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <>
      <Header />
      <div className="page">
        <h1>Dashboard</h1>
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



