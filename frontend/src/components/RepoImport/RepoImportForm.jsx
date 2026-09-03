import React, { useState } from 'react';
import { ServicesAPI, DeploymentsAPI } from '../../api/endpoints';

const RepoImportForm = ({ services = [], onServiceCreated, onDeploymentTriggered }) => {
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [status, setStatus] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!name.trim() || !repoUrl.trim()) return;
    setIsCreating(true);
    setStatus(null);
    try {
      const res = await ServicesAPI.create({ name, repoUrl });
      setStatus({ type: 'success', message: `Service "${res.data.name}" successfully registered into Kubernetes control plane.` });
      setName('');
      setRepoUrl('');
      if (onServiceCreated) onServiceCreated();
      setSelectedServiceId(res.data._id);
    } catch (err) {
      setStatus({ type: 'error', message: `Error registering service: ${err.response?.data?.message || err.message}` });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTriggerDeployment = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setStatus({ type: 'warning', message: 'Please select a microservice first.' });
      return;
    }
    setIsDeploying(true);
    setStatus(null);
    try {
      const res = await DeploymentsAPI.trigger({ serviceId: selectedServiceId, commitSha });
      setStatus({ type: 'success', message: `CI/CD Deployment queued for rollout (ID: ${res.data._id})` });
      if (onDeploymentTriggered) onDeploymentTriggered();
    } catch (err) {
      setStatus({ type: 'error', message: `Deployment dispatch error: ${err.response?.data?.message || err.message}` });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent-primary)' }}>●</span>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Workload Registration &amp; Pipeline Rollout
          </span>
        </div>
        <span className="badge-pill badge-neutral font-mono">k8s-prod-d4</span>
      </div>

      <div className="card-panel-body" style={{ gap: 18 }}>
        {/* SECTION 1: REGISTER SERVICE */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Register New Microservice
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kubernetes Isolation Boundary</span>
          </div>

          <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                className="form-input"
                placeholder="Service Identifier (e.g. checkout-service)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ flex: 1, minWidth: '180px' }}
              />
              <input
                className="form-input"
                placeholder="Git Repository URL (https://github.com/...)"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                required
                style={{ flex: 1.5, minWidth: '220px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={isCreating} className="btn btn-primary btn-sm">
                {isCreating ? 'Registering...' : 'Register Service'}
              </button>
            </div>
          </form>
        </div>

        <div style={{ height: '1px', background: 'var(--border)' }} />

        {/* SECTION 2: TRIGGER CI/CD DEPLOYMENT */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Dispatch CI/CD Rollout
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GitHub Actions / ArgoCD</span>
          </div>

          <form onSubmit={handleTriggerDeployment} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select
                className="form-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                style={{ flex: 1.2, minWidth: '180px' }}
              >
                <option value="">-- Choose Target Service --</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.namespace || 'default'})
                  </option>
                ))}
              </select>
              <input
                className="form-input font-mono"
                placeholder="Target Commit SHA (defaults to HEAD)"
                value={commitSha}
                onChange={(e) => setCommitSha(e.target.value)}
                style={{ flex: 1, minWidth: '160px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isDeploying || !selectedServiceId}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--status-telemetry)', fontWeight: 600 }}
              >
                {isDeploying ? 'Dispatching...' : 'Trigger Rollout'}
              </button>
            </div>
          </form>
        </div>

        {/* Status Alert */}
        {status && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              background: status.type === 'success' ? 'var(--status-healthy-subtle)' : 'var(--status-critical-subtle)',
              border: `1px solid ${status.type === 'success' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
              color: status.type === 'success' ? 'var(--status-healthy)' : 'var(--status-critical)',
            }}
          >
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoImportForm;