import React from 'react';

// Displays the LLM-generated "reason" text attached to a RecoveryAction.
// Kept as a standalone component so it can be reused inside SelfHealingPanel
// or shown in a modal/detail view once the dashboard is fleshed out.
const ExplainabilityCard = ({ actionType, reason, verified }) => (
  <div className="panel">
    <h4>Why this action was chosen: {actionType}</h4>
    <p>{reason || 'No explanation generated yet.'}</p>
    <p>
      Requirement verified post-recovery:{' '}
      <strong style={{ color: verified ? '#4caf50' : '#e0a552' }}>
        {verified ? 'Yes' : 'Not yet confirmed'}
      </strong>
    </p>
  </div>
);

export default ExplainabilityCard;

