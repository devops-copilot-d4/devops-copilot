import React from 'react';
import GithubLoginButton from '../components/Auth/GithubLoginButton';

const LoginPage = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg)',
    padding: '20px',
  }}>
    <div className="card-panel" style={{
      maxWidth: '480px',
      width: '100%',
      padding: '36px 32px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 48,
        height: 48,
        background: 'var(--accent-primary)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        color: '#fff',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>

      <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--text-primary)' }}>
        AI DEVOPS COPILOT
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, margin: '0 0 20px' }}>
        Autonomous CI/CD Failure Prediction, SLO-Driven Continuous Verification &amp; Kubernetes Self-Healing
      </p>

      <div style={{
        marginBottom: 24,
        padding: '12px 14px',
        background: 'var(--bg-card-elevated)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        textAlign: 'left',
        lineHeight: 1.6,
      }}>
        <div><strong>Institution:</strong> The National Institute of Engineering (NIE, Mysuru)</div>
        <div><strong>Batch:</strong> D4 • Dept. of Computer Science &amp; Engineering</div>
        <div><strong>Guide:</strong> Mrs. Sneha S (Assistant Professor)</div>
      </div>

      <GithubLoginButton />
    </div>
  </div>
);

export default LoginPage;
