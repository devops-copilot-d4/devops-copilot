import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SimulationAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const getPodBadgeClass = (status) => {
  switch (status) {
    case 'Running':
      return 'badge-success';
    case 'CrashLoopBackOff':
    case 'Error':
    case 'Failed':
      return 'badge-danger';
    case 'ContainerCreating':
    case 'Terminating':
    case 'Pending':
    default:
      return 'badge-warning';
  }
};

const PodGridPanel = ({ refreshKey }) => {
  const [clusterInfo, setClusterInfo] = useState(null);

  const fetchPods = useCallback(() => {
    SimulationAPI.getPods()
      .then((res) => setClusterInfo(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPods();

    const socket = io(SOCKET_URL);
    socket.on('k8s:update', (payload) => {
      setClusterInfo(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchPods, refreshKey]);

  const pods = clusterInfo?.pods || [];

  return (
    <div className="data-card">
      <div className="card-header">
        <div className="card-header-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>Kubernetes Deployment &amp; Pod Topology</span>
        </div>
        <div className="card-header-actions">
          <span className="badge badge-neutral font-mono">
            ns: {clusterInfo?.namespace || 'default'}
          </span>
          <span className={`badge ${clusterInfo?.status === 'Healthy' ? 'badge-success' : 'badge-warning'}`}>
            Replicas: {clusterInfo?.availableReplicas || pods.length}/{clusterInfo?.replicas || pods.length}
          </span>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pod Name</th>
              <th>Status</th>
              <th>Ready</th>
              <th>Restarts</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>Node</th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod) => (
              <tr key={pod.name}>
                <td>
                  <strong className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                    {pod.name}
                  </strong>
                </td>
                <td>
                  <span className={`badge ${getPodBadgeClass(pod.status)}`}>
                    {pod.status}
                  </span>
                </td>
                <td className="font-mono">{pod.ready || '1/1'}</td>
                <td className="font-mono" style={{ color: pod.restarts > 0 ? 'var(--status-warning)' : 'inherit' }}>
                  {pod.restarts}
                </td>
                <td className="font-mono">{pod.cpu}</td>
                <td className="font-mono">{pod.memory}</td>
                <td className="font-mono" style={{ color: 'var(--text-muted)' }}>{pod.node || 'worker-1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PodGridPanel;
