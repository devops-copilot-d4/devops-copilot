import React from 'react';
import RepoImportForm from '../components/RepoImport/RepoImportForm';
import DeploymentStatusList from '../components/DeploymentStatus/DeploymentStatusList';
import SLOPanel from '../components/Monitoring/SLOPanel';
import RequirementTraceabilityView from '../components/RequirementTraceability/RequirementTraceabilityView';
import AIInsightsPanel from '../components/AIInsights/AIInsightsPanel';
import SelfHealingPanel from '../components/SelfHealing/SelfHealingPanel';
import Header from '../components/Header/Header';
const DashboardPage = () => (
  <>
    <Header />
    <div className="page">
      <h1>Dashboard</h1>
      <RepoImportForm />
      <DeploymentStatusList />
      <RequirementTraceabilityView />
      <SLOPanel />
      <AIInsightsPanel />
      <SelfHealingPanel />
    </div>
  </>
);

export default DashboardPage;

