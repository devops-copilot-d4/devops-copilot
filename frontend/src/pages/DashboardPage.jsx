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

  const loadServices = useCallback(() => {
    ServicesAPI.list()
      .then((res) => setServices(res.data))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  return (
    <>
      <Header />
      <div className="page">
        <h1>Dashboard</h1>
        <RepoImportForm services={services} onServiceCreated={loadServices} />
        <DeploymentStatusList />
        <RequirementForm services={services} onCreated={loadServices} />
        <RequirementTraceabilityView />
        <SLOPanel />
        <AIInsightsPanel />
        <SelfHealingPanel />
      </div>
    </>
  );
};

export default DashboardPage;


