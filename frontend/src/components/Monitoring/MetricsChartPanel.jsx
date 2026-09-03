import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { SimulationAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const MetricsChartPanel = ({ refreshKey }) => {
  const [data, setData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [threshold, setThreshold] = useState(300);

  const fetchMetrics = useCallback(() => {
    SimulationAPI.getMetrics()
      .then((res) => {
        setData(res.data.metrics || []);
        setPrediction(res.data.prediction);
        if (res.data.threshold) setThreshold(res.data.threshold);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMetrics();

    const socket = io(SOCKET_URL);
    socket.on('metrics:update', (payload) => {
      if (payload?.metrics) {
        setData(payload.metrics);
      }
      fetchMetrics();
    });

    const interval = setInterval(fetchMetrics, 8000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [fetchMetrics, refreshKey]);

  const latestLatency = data.length > 0 ? data[data.length - 1].latency : 140;
  const isBreached = latestLatency >= threshold;

  return (
    <div className="panel" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--cyan)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </span>
            <span>Real-Time Telemetry &amp; SLO Observability</span>
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Live P95 Request Duration vs. Business SLO Limit ({threshold}ms) • Prometheus Scrape Gateway
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current P95: </span>
          <strong style={{ fontSize: '18px', color: isBreached ? 'var(--danger)' : 'var(--success)', marginLeft: 4 }}>
            {latestLatency} ms
          </strong>
        </div>
      </div>

      {/* AI Failure Prediction Alert Banner */}
      {prediction?.isPredictedViolation && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid var(--danger)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)',
        }}>
          <div style={{
            backgroundColor: 'var(--danger)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            WARNING
          </div>
          <div>
            <strong>AI Trend Prediction: Impending SLO Breach Detected</strong>
            <div style={{ color: 'var(--text)', marginTop: 2 }}>{prediction.recommendation}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
              Confidence Score: {Math.round(prediction.riskScore * 100)}% | Time to Breach: ~{prediction.estimatedTimeToBreachSec}s
            </div>
          </div>
        </div>
      )}

      {/* Recharts Live Chart */}
      <div style={{ width: '100%', height: 220, marginTop: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isBreached ? '#ef4444' : '#6366f1'} stopOpacity={0.5} />
                <stop offset="95%" stopColor={isBreached ? '#ef4444' : '#6366f1'} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} domain={[0, 'dataMax + 100']} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
              labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
            />
            <ReferenceLine
              y={threshold}
              label={{ value: `SLO Limit (${threshold}ms)`, fill: '#ef4444', fontSize: 11, position: 'top' }}
              stroke="#ef4444"
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="latency"
              name="P95 Latency (ms)"
              stroke={isBreached ? '#ef4444' : '#6366f1'}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#latencyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsChartPanel;
