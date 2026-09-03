import React, { useState } from 'react';

const SettingsPanel = () => {
  const [refreshInterval, setRefreshInterval] = useState('5s');
  const [autonomousRecovery, setAutonomousRecovery] = useState(true);
  const [minConfidence, setMinConfidence] = useState('85%');
  const [cooldownSec, setCooldownSec] = useState(60);
  const [maxRetries, setMaxRetries] = useState(2);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    setSaveStatus('Cluster policies and safety parameters updated successfully.');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
      {/* 1. GENERAL SETTINGS */}
      <div className="card-panel">
        <div className="card-panel-header">
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            General Configuration
          </span>
          <span className="badge-pill badge-neutral">Cluster Scope</span>
        </div>
        <div className="card-panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Target Kubernetes Cluster</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Production orchestration plane</div>
            </div>
            <code className="font-mono">k8s-prod-d4</code>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Environment Tier</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Workload isolation boundary</div>
            </div>
            <span className="badge-pill badge-healthy">Production</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Telemetry Scrape Frequency</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>High-resolution time-series polling</div>
            </div>
            <select
              className="form-select"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              style={{ maxWidth: 130 }}
            >
              <option value="5s">5 seconds</option>
              <option value="15s">15 seconds</option>
              <option value="30s">30 seconds</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. AI INTELLIGENCE POLICIES */}
      <div className="card-panel">
        <div className="card-panel-header">
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-ai)' }}>
            AI Diagnostic Engine
          </span>
          <span className="badge-pill badge-ai">✦ Inference Engine</span>
        </div>
        <div className="card-panel-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Failure Prediction Model</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Supervised Random Forest Classifier</div>
            </div>
            <span className="badge-pill badge-healthy">Enabled</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Autonomous Self-Healing</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Execute allow-listed remediation</div>
            </div>
            <button
              onClick={() => setAutonomousRecovery(!autonomousRecovery)}
              className={`btn ${autonomousRecovery ? 'btn-ai' : 'btn-secondary'} btn-sm`}
            >
              {autonomousRecovery ? 'Enabled' : 'Approval Gated'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Minimum Confidence Threshold</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Confidence required for auto-remediation</div>
            </div>
            <select
              className="form-select"
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              style={{ maxWidth: 100 }}
            >
              <option value="80%">80%</option>
              <option value="85%">85%</option>
              <option value="90%">90%</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. SAFETY GUARDRAILS */}
      <div className="card-panel" style={{ gridColumn: '1 / -1' }}>
        <div className="card-panel-header">
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Safety Guardrails &amp; Policy Bounds
          </span>
          <span className="badge-pill badge-healthy">Policy Enforced</span>
        </div>
        <div className="card-panel-body">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Approved Allow-List Actions
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span className="badge-pill badge-healthy" style={{ padding: '4px 10px' }}>✓ Restart Pod</span>
              <span className="badge-pill badge-healthy" style={{ padding: '4px 10px' }}>✓ Rollback Deployment</span>
              <span className="badge-pill badge-healthy" style={{ padding: '4px 10px' }}>✓ Scale Deployment</span>
              <span className="badge-pill badge-healthy" style={{ padding: '4px 10px' }}>✓ Recreate Resource</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Maximum Autonomous Retries</div>
              <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{maxRetries} Retries</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Safety Cooldown Window</div>
              <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{cooldownSec} Seconds</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <button onClick={handleSave} className="btn btn-primary btn-sm">
              Save Configuration
            </button>
          </div>
          {saveStatus && (
            <div style={{ color: 'var(--status-healthy)', fontSize: '12px' }}>
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
