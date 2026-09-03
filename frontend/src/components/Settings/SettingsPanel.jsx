import React, { useState } from 'react';

const SettingsPanel = () => {
  const [llmProvider, setLlmProvider] = useState('gemini');
  const [autonomousHealing, setAutonomousHealing] = useState(true);
  const [autoRollback, setAutoRollback] = useState(true);
  const [prometheusUrl, setPrometheusUrl] = useState('http://localhost:9090');
  const [scrapeInterval, setScrapeInterval] = useState('15s');
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T000/B000/XXXX');
  const [saveStatus, setSaveStatus] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    setSaveStatus('Cluster configuration and AI policies updated successfully.');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
      {/* AI & LLM Engine Settings */}
      <div className="data-card">
        <div className="card-header">
          <div className="card-header-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>AI Diagnostic Engine Policies</span>
          </div>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Active LLM Provider</label>
            <select
              className="form-select"
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value)}
            >
              <option value="gemini">Google Gemini 2.0 Flash (Default)</option>
              <option value="claude">Anthropic Claude 3.5 Sonnet</option>
              <option value="groq">Groq (Llama 3.3 70B)</option>
              <option value="openai">OpenAI GPT-4o-mini</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <strong style={{ fontSize: '12px' }}>Autonomous Execution Mode</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {autonomousHealing ? 'Automatic remediation on detected breach' : 'Requires human operator approval'}
              </div>
            </div>
            <button
              type="button"
              className={`btn ${autonomousHealing ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setAutonomousHealing(!autonomousHealing)}
            >
              {autonomousHealing ? 'Autonomous: Active' : 'Approval Gated'}
            </button>
          </div>
        </div>
      </div>

      {/* Kubernetes Resilience Policy */}
      <div className="data-card">
        <div className="card-header">
          <div className="card-header-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>Kubernetes Policy Guard</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <strong style={{ fontSize: '12px' }}>SLO Verification Rollback</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Auto-rollback if business SLO is not verified within 60s
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoRollback}
              onChange={(e) => setAutoRollback(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target Isolation Namespace:</span>
            <code>default</code>
          </div>
        </div>
      </div>

      {/* Prometheus Telemetry Scraper */}
      <div className="data-card">
        <div className="card-header">
          <div className="card-header-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>Prometheus Telemetry Gateway</span>
          </div>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Prometheus Server URL</label>
            <input
              className="form-input"
              value={prometheusUrl}
              onChange={(e) => setPrometheusUrl(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Metrics Scrape Frequency</label>
            <select
              className="form-select"
              value={scrapeInterval}
              onChange={(e) => setScrapeInterval(e.target.value)}
            >
              <option value="5s">5 seconds (High resolution)</option>
              <option value="15s">15 seconds (Standard)</option>
              <option value="30s">30 seconds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Webhooks & Alerts */}
      <div className="data-card">
        <div className="card-header">
          <div className="card-header-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Alerting &amp; Notification Webhooks</span>
          </div>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Slack / Incident Dispatch Webhook</label>
            <input
              className="form-input"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={handleSave} className="btn btn-primary">
              Save Policy Changes
            </button>
          </div>
          {saveStatus && (
            <div style={{ color: 'var(--status-success)', fontSize: '12px', marginTop: 4 }}>
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
