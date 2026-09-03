import React, { useEffect, useState } from 'react';
import { RecoveryAPI } from '../../api/endpoints';
import ExplainabilityCard from '../Explainability/ExplainabilityCard';

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
      <h3>Self-Healing Actions &amp; Explainability</h3>
      {actions.length === 0 && <p>No recovery actions yet.</p>}
      <ul>
        {actions.map((a) => (
          <li key={a._id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <strong>{a.actionType}</strong> on <em>{a.service?.name || 'Unknown service'}</em> - status:{' '}
                <strong style={{ color: a.status === 'success' ? '#22c55e' : a.status === 'failed' ? '#ef4444' : '#f59e0b' }}>
                  {a.status}
                </strong>
              </span>
              {a.requiresApproval && a.status === 'pending_approval' && (
                <button onClick={() => handleApprove(a._id)} style={{ marginLeft: 8 }}>
                  Approve Action
                </button>
              )}
            </div>
            <ExplainabilityCard
              actionType={a.actionType}
              reason={a.reason}
              verified={a.requirementVerified}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SelfHealingPanel;


