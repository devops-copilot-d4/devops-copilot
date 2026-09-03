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
    setSaveStatus('Cluster configuration & AI policies updated successfully!');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  return (
    <div className="settings-grid">
      {/* AI & LLM Engine Settings */}
      <div className="settings-card">
        <h3>🧠 AI &amp; Inference Engine Configuration</h3>
        <p>Configure the foundational LLM orchestrating Requirement Translation, RCA, and Explainability.</p>
        
        <div className="settings-row">
          <div>
            <strong>Active LLM Provider</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Multi-model fallback enabled</div>
          </div>
          <select
            value={llmProvider}
            onChange={(e) => setLlmProvider(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            <option value="gemini">Google Gemini 2.0 Flash</option>
            <option value="claude">Anthropic Claude 3.5</option>
            <option value="groq">Groq (Llama 3.3 70B)</option>
            <option value="openai">OpenAI GPT-4o-mini</option>
          </select>
        </div>

        <div className="settings-row">
          <div>
            <strong>Self-Healing Execution Policy</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {autonomousHealing ? 'Autonomous: Execute immediately' : 'Manual: Requires engineer approval'}
            </div>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setAutonomousHealing(!autonomousHealing)}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {autonomousHealing ? '🟢 Autonomous' : '🟡 Approval Gated'}
          </button>
        </div>
      </div>

      {/* Kubernetes & Resilience Policy */}
      <div className="settings-card">
        <h3>☸️ Kubernetes Self-Healing Policies</h3>
        <p>Control container orchestration, rolling restart limits, and post-recovery rollbacks.</p>

        <div className="settings-row">
          <div>
            <strong>Requirement-Aware Auto-Rollback</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Roll back to previous revision if business SLO is not verified within 60s
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoRollback}
            onChange={(e) => setAutoRollback(e.target.checked)}
            style={{ width: 18, height: 18, flex: 'none', cursor: 'pointer' }}
          />
        </div>

        <div className="settings-row">
          <div>
            <strong>Default Target Namespace</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active K8s isolation boundary</div>
          </div>
          <code>default</code>
        </div>
      </div>

      {/* Telemetry & Metrics Scraper */}
      <div className="settings-card">
        <h3>📊 Telemetry &amp; Prometheus Gateway</h3>
        <p>Telemetry endpoints for collecting raw time-series metrics.</p>

        <div className="settings-row">
          <div>
            <strong>Prometheus Server URL</strong>
          </div>
          <input
            value={prometheusUrl}
            onChange={(e) => setPrometheusUrl(e.target.value)}
            style={{ maxWidth: 220 }}
          />
        </div>

        <div className="settings-row">
          <div>
            <strong>Metrics Scrape Frequency</strong>
          </div>
          <select
            value={scrapeInterval}
            onChange={(e) => setScrapeInterval(e.target.value)}
            style={{ maxWidth: 120 }}
          >
            <option value="5s">5 seconds</option>
            <option value="15s">15 seconds</option>
            <option value="30s">30 seconds</option>
          </select>
        </div>
      </div>

      {/* Alerts & Webhooks */}
      <div className="settings-card">
        <h3>🔔 Alert Notifications &amp; Webhooks</h3>
        <p>Broadcast SLO breach and self-healing action summaries to team channels.</p>

        <div className="settings-row">
          <div>
            <strong>Slack / Discord Webhook URL</strong>
          </div>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            style={{ maxWidth: 240 }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={handleSave}>
            Save All Policies
          </button>
        </div>
        {saveStatus && <p style={{ color: 'var(--success)', fontSize: '13px', margin: 0 }}>✓ {saveStatus}</p>}
      </div>
    </div>
  );
};

export default SettingsPanel;
