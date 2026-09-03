import React from 'react';
import GithubLoginButton from '../components/Auth/GithubLoginButton';

const LoginPage = () => (
  <div className="login-shell">
    <div className="panel login-card" style={{ maxWidth: '480px', padding: '40px 36px' }}>
      <div className="login-card__icon" style={{ width: '60px', height: '60px', borderRadius: '16px', marginBottom: '20px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      </div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
        AI DevOps Copilot
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 24px' }}>
        Autonomous CI/CD Failure Prediction, SLO-Driven Continuous Verification &amp; Kubernetes Self-Healing
      </p>

      <div style={{ marginBottom: 24, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'left' }}>
        <div><strong>Institution:</strong> The National Institute of Engineering (NIE, Mysuru)</div>
        <div style={{ marginTop: 4 }}><strong>Project Batch:</strong> D4 • Dept. of CSE</div>
        <div style={{ marginTop: 4 }}><strong>Guide:</strong> Mrs. Sneha S (Assistant Professor)</div>
      </div>

      <GithubLoginButton />
    </div>
  </div>
);

export default LoginPage;

