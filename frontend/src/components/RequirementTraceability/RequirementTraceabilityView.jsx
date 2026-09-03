import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { RequirementsAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const RequirementTraceabilityView = ({ refreshKey }) => {
  const [requirements, setRequirements] = useState([]);

  const loadRequirements = useCallback(() => {
    RequirementsAPI.list()
      .then((res) => setRequirements(res.data))
      .catch(() => setRequirements([]));
  }, []);

  useEffect(() => {
    loadRequirements();

    const socket = io(SOCKET_URL);
    socket.on('requirement:new', () => {
      loadRequirements();
    });

    return () => {
      socket.disconnect();
    };
  }, [loadRequirements, refreshKey]);

  return (
    <div className="panel">
      <h3>Requirement -&gt; Service -&gt; SLO Traceability</h3>
      {requirements.length === 0 && <p>No requirements added yet.</p>}
      <ul>
        {requirements.map((r) => (
          <li key={r._id}>
            "{r.text}" -&gt; service: <strong>{r.service?.name || 'unlinked'}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RequirementTraceabilityView;


