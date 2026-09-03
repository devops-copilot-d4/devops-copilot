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
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* SECTION 1: REGISTER SERVICE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </span>
            <span>Register New Microservice</span>
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 12 }}>
            Kubernetes Workload
          </span>
        </div>

        <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              placeholder="Service Identifier (e.g. checkout-service)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ flex: 1, minWidth: '200px' }}
            />
            <input
              placeholder="Git Repository URL (https://github.com/...)"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
              style={{ flex: 1.5, minWidth: '240px' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isCreating} style={{ padding: '8px 16px', fontSize: '13px' }}>
              {isCreating ? 'Registering...' : 'Register Service'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ height: '1px', background: 'var(--border)' }} />

      {/* SECTION 2: TRIGGER CI/CD DEPLOYMENT */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--cyan)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </span>
            <span>Trigger CI/CD Pipeline</span>
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 12 }}>
            GitHub Actions / ArgoCD
          </span>
        </div>

        <form onSubmit={handleTriggerDeployment} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              style={{ flex: 1.2, minWidth: '200px' }}
            >
              <option value="">-- Choose Target Service --</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.namespace || 'default'})
                </option>
              ))}
            </select>
            <input
              placeholder="Target Commit SHA (optional, defaults to HEAD)"
              value={commitSha}
              onChange={(e) => setCommitSha(e.target.value)}
              style={{ flex: 1, minWidth: '180px', fontFamily: 'monospace' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isDeploying || !selectedServiceId}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              }}
            >
              {isDeploying ? 'Dispatching...' : 'Trigger Rollout'}
            </button>
          </div>
        </form>
      </div>

      {/* FEEDBACK STATUS ALERT */}
      {status && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '13px',
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: status.type === 'success' ? '#a7f3d0' : '#fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default RepoImportForm;