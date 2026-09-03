import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { DeploymentsAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const getStatusColor = (status) => {
  switch (status) {
    case 'success':
    case 'running':
      return '#22c55e';
    case 'building':
    case 'deploying':
      return '#3b82f6';
    case 'failed':
      return '#ef4444';
    case 'queued':
    case 'pending':
    default:
      return '#f59e0b';
  }
};

const DeploymentStatusList = () => {
  const [deployments, setDeployments] = useState([]);

  const fetchDeployments = useCallback(() => {
    DeploymentsAPI.list()
      .then((res) => setDeployments(res.data))
      .catch(() => setDeployments([]));
  }, []);

  useEffect(() => {
    fetchDeployments();

    const socket = io(SOCKET_URL);

    socket.on('deployment:update', (payload) => {
      fetchDeployments();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchDeployments]);

  return (
    <div className="panel">
      <h3>Recent Deployments</h3>
      {deployments.length === 0 && <p>No deployments yet.</p>}
      <ul>
        {deployments.map((d) => (
          <li key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <strong>{d.service?.name || 'Unknown service'}</strong>
              {d.commitSha && <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.85em' }}>({d.commitSha.substring(0, 7)})</span>}
            </span>
            <span style={{ fontSize: '0.9em' }}>
              build:{' '}
              <strong style={{ color: getStatusColor(d.buildStatus) }}>
                {d.buildStatus}
              </strong>
              {' | '}
              deploy:{' '}
              <strong style={{ color: getStatusColor(d.deployStatus) }}>
                {d.deployStatus}
              </strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeploymentStatusList;


