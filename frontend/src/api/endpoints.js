import api from './client';

export const ServicesAPI = {
  create: (data) => api.post('/services', data),
  list: () => api.get('/services'),
};

export const RequirementsAPI = {
  create: (data) => api.post('/requirements', data),
  list: () => api.get('/requirements'),
  getById: (id) => api.get(`/requirements/${id}`),
};

export const DeploymentsAPI = {
  trigger: (data) => api.post('/deployments/trigger', data),
  list: () => api.get('/deployments'),
  status: (id) => api.get(`/deployments/${id}/status`),
};

export const MonitoringAPI = {
  sloStatus: () => api.get('/monitoring/slo'),
  refreshSLO: (id) => api.post(`/monitoring/slo/${id}/refresh`),
};

export const AIInsightsAPI = {
  predict: (telemetry) => api.post('/ai/predict', telemetry),
  copilotDiagnose: (data) => api.post('/ai/copilot/diagnose', data),
  runRCA: (data) => api.post('/ai/rca', data),
  incidents: () => api.get('/ai/incidents'),
};

export const RecoveryAPI = {
  create: (data) => api.post('/recovery', data),
  approve: (id) => api.post(`/recovery/${id}/approve`),
  list: () => api.get('/recovery'),
};

export const SimulationAPI = {
  getMetrics: () => api.get('/simulation/metrics'),
  getPods: (params) => api.get('/simulation/pods', { params }),
  triggerChaos: (data) => api.post('/simulation/chaos', data),
};
