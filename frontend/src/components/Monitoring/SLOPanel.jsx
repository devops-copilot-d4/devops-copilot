import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { MonitoringAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SLOPanel = ({ refreshKey }) => {
  const [slos, setSlos] = useState([]);

  const loadSLOs = useCallback(() => {
    MonitoringAPI.sloStatus()
      .then((res) => setSlos(res.data))
      .catch(() => setSlos([]));
  }, []);

  useEffect(() => {
    loadSLOs();

    const socket = io(SOCKET_URL);
    socket.on('slo:update', () => {
      loadSLOs();
    });
    socket.on('requirement:new', () => {
      loadSLOs();
    });

    return () => {
      socket.disconnect();
    };
  }, [loadSLOs, refreshKey]);

  return (
    <div className="panel">
      <h3>SLO Status</h3>
      {slos.length === 0 && <p>No SLOs tracked yet.</p>}
      <ul>
        {slos.map((s) => (
          <li key={s._id}>
            {s.requirement?.text} -{' '}
            <strong style={{ color: s.status === 'violated' ? '#e05252' : '#4caf50' }}>
              {s.status}
            </strong>{' '}
            (threshold {s.comparator} {s.threshold} {s.unit})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SLOPanel;


