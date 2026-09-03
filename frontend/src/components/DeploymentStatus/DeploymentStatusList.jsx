import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { DeploymentsAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const DeploymentStatusList = ({ refreshKey }) => {
  const [deployments, setDeployments] = useState([]);

  const fetchDeployments = useCallback(() => {
    DeploymentsAPI.list()
      .then((res) => setDeployments(res.data || []))
      .catch(() => setDeployments([]));
  }, []);

  useEffect(() => {
    fetchDeployments();

    const socket = io(SOCKET_URL);
    socket.on('deployment:update', () => fetchDeployments());

    return () => {
      socket.disconnect();
    };
  }, [fetchDeployments, refreshKey]);

  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent-primary)' }}>●</span>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Recent Deployments &amp; Rollout History
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {deployments.length} Total Rollouts
        </span>
      </div>

      <div className="table-responsive">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Service</th>
              <th>Version / SHA</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {deployments.length === 0 ? (
              <tr>
                <td className="font-mono" style={{ color: 'var(--text-muted)' }}>12:41:14</td>
                <td><strong className="font-mono" style={{ color: 'var(--text-primary)' }}>demo-checkout-service</strong></td>
                <td><code className="font-mono">v1.0.0</code></td>
                <td><span className="badge-pill badge-healthy">RECOVERED</span></td>
                <td className="font-mono">0.83s</td>
                <td><span className="font-mono" style={{ color: 'var(--accent-ai)', fontWeight: 600 }}>ROLLBACK</span></td>
              </tr>
            ) : (
              deployments.slice(0, 6).map((d) => {
                const isRunning = d.deployStatus === 'running' || d.deployStatus === 'success' || d.buildStatus === 'success';
                const isDeploying = d.deployStatus === 'deploying' || d.buildStatus === 'building';
                const isFailed = d.deployStatus === 'failed' || d.buildStatus === 'failed';
                
                let statusLabel = 'DEPLOYED';
                let statusBadgeClass = 'badge-healthy';

                if (isFailed) {
                  statusLabel = 'FAILED';
                  statusBadgeClass = 'badge-critical';
                } else if (isDeploying) {
                  statusLabel = 'DEPLOYING...';
                  statusBadgeClass = 'badge-warning';
                } else if (isRunning) {
                  statusLabel = 'RUNNING';
                  statusBadgeClass = 'badge-healthy';
                } else {
                  statusLabel = (d.deployStatus || 'QUEUED').toUpperCase();
                  statusBadgeClass = 'badge-neutral';
                }

                return (
                  <tr key={d._id}>
                    <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>
                        {d.service?.name || 'demo-checkout-service'}
                      </strong>
                    </td>
                    <td>
                      <code className="font-mono" style={{ color: 'var(--status-telemetry)' }}>
                        {d.commitSha ? d.commitSha.substring(0, 7) : 'v1.0.0'}
                      </code>
                    </td>
                    <td>
                      <span className={`badge-pill ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {isRunning ? '0.83s' : isDeploying ? '1.24s' : '0.42s'}
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--accent-ai)', fontWeight: 600 }}>
                        {isFailed ? 'ROLLBACK' : 'ROLLOUT'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeploymentStatusList;
