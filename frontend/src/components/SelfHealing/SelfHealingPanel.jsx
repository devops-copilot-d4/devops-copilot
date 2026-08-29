import React, { useEffect, useState } from 'react';
import { RecoveryAPI } from '../../api/endpoints';

const SelfHealingPanel = () => {
  const [actions, setActions] = useState([]);

  const load = () => {
    RecoveryAPI.list()
      .then((res) => setActions(res.data))
      .catch(() => setActions([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    await RecoveryAPI.approve(id);
    load();
  };

  return (
    <div className="panel">
      <h3>Self-Healing Actions</h3>
      {actions.length === 0 && <p>No recovery actions yet.</p>}
      <ul>
        {actions.map((a) => (
          <li key={a._id}>
            {a.actionType} on {a.service?.name} - status: {a.status}
            {a.requiresApproval && a.status === 'pending_approval' && (
              <button onClick={() => handleApprove(a._id)} style={{ marginLeft: 8 }}>
                Approve
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SelfHealingPanel;

