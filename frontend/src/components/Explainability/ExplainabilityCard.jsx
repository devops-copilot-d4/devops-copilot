import React from 'react';

const ExplainabilityCard = ({ actionType, reason, verified }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 14px',
    marginTop: '6px',
  }}>
    <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      AI Explainability Decision Rationale ({actionType})
    </h4>
    <p style={{ margin: '0 0 8px 0', fontSize: '13px', lineHeight: '1.5', color: '#e2e8f0' }}>
      {reason || 'No explanation generated yet.'}
    </p>
    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
      Business Requirement Post-Recovery Verification:{' '}
      <strong style={{ color: verified ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
        {verified ? 'Verified (Requirement Met)' : 'Pending / Unconfirmed'}
      </strong>
    </div>
  </div>
);

export default ExplainabilityCard;
