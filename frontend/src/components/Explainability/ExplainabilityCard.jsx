import React from 'react';

// Displays the LLM-generated "reason" text attached to a RecoveryAction.
// Kept as a standalone component so it can be reused inside SelfHealingPanel
// or shown in a modal/detail view once the dashboard is fleshed out.
const ExplainabilityCard = ({ actionType, reason, verified }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 14px',
    marginTop: '6px',
  }}>
    <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
      AI Explainability Decision Rationale ({actionType}):
    </h4>
    <p style={{ margin: '0 0 8px 0', fontSize: '14px', lineHeight: '1.4' }}>
      {reason || 'No explanation generated yet.'}
    </p>
    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
      Business Requirement Post-Recovery Verification:{' '}
      <strong style={{ color: verified ? '#22c55e' : '#f59e0b' }}>
        {verified ? '✓ Verified (Requirement Met)' : '⏳ Pending / Unconfirmed'}
      </strong>
    </div>
  </div>
);


export default ExplainabilityCard;

