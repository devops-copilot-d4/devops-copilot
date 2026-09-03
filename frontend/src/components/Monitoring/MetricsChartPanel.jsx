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
  const [threshold, setThreshold] = useState(300);

  const fetchMetrics = useCallback(() => {
    SimulationAPI.getMetrics()
      .then((res) => {
        const rawMetrics = res.data?.metrics || [];
        // Map data points with cpu, memory, and error rate values
        const points = rawMetrics.map((pt, i) => {
          const lat = pt.latency || 140;
          const isSpike = lat >= 300;
          return {
            time: pt.time || `${12 + Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}`,
            latency: lat,
            cpu: isSpike ? 95 : 21 + (i % 5) * 2,
            memory: isSpike ? 92 : 34 + (i % 4) * 2,
            errorRate: isSpike ? 18.0 : 0.05,
          };
        });
        setData(points);
        if (res.data?.threshold) setThreshold(res.data.threshold);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMetrics();

    const socket = io(SOCKET_URL);
    socket.on('metrics:update', () => fetchMetrics());

    const interval = setInterval(fetchMetrics, 8000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [fetchMetrics, refreshKey]);

  const latestPoint = data[data.length - 1] || { cpu: 21, memory: 34, errorRate: 0.05, latency: 140 };
  const isBreached = latestPoint.latency >= threshold || latestPoint.cpu >= 85;

  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--status-telemetry)' }}>●</span>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Telemetry Metrics &amp; SLO Observability
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '11px', fontFamily: 'JetBrains Mono' }}>
          <span>CPU: <strong style={{ color: latestPoint.cpu >= 80 ? 'var(--status-critical)' : 'var(--status-healthy)' }}>{latestPoint.cpu}%</strong></span>
          <span>•</span>
          <span>MEM: <strong style={{ color: latestPoint.memory >= 80 ? 'var(--status-critical)' : 'var(--status-healthy)' }}>{latestPoint.memory}%</strong></span>
          <span>•</span>
          <span>ERROR: <strong style={{ color: latestPoint.errorRate > 1 ? 'var(--status-critical)' : 'var(--status-healthy)' }}>{latestPoint.errorRate}%</strong></span>
          <span>•</span>
          <span>P95: <strong style={{ color: isBreached ? 'var(--status-critical)' : 'var(--status-healthy)' }}>{latestPoint.latency}ms</strong></span>
        </div>
      </div>

      <div className="card-panel-body" style={{ gap: 20 }}>
        {/* 3 Metric Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* 1. CPU Utilization Chart */}
          <div style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CPU Utilization
              </span>
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: latestPoint.cpu >= 80 ? 'var(--status-critical)' : 'var(--status-telemetry)' }}>
                {latestPoint.cpu}%
              </span>
            </div>
            <div style={{ width: '100%', height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(37, 43, 52, 0.6)" />
                  <XAxis dataKey="time" stroke="#4B5563" fontSize={10} tickLine={false} />
                  <YAxis stroke="#4B5563" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#11151B', border: '1px solid #252B34', borderRadius: 4, fontSize: '11px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    name="CPU %"
                    stroke={latestPoint.cpu >= 80 ? 'var(--status-critical)' : '#06B6D4'}
                    strokeWidth={1.8}
                    fill={latestPoint.cpu >= 80 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.12)'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Memory Utilization Chart */}
          <div style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Memory Utilization
              </span>
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: latestPoint.memory >= 80 ? 'var(--status-critical)' : 'var(--accent-primary)' }}>
                {latestPoint.memory}%
              </span>
            </div>
            <div style={{ width: '100%', height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(37, 43, 52, 0.6)" />
                  <XAxis dataKey="time" stroke="#4B5563" fontSize={10} tickLine={false} />
                  <YAxis stroke="#4B5563" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#11151B', border: '1px solid #252B34', borderRadius: 4, fontSize: '11px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    name="Memory %"
                    stroke={latestPoint.memory >= 80 ? 'var(--status-critical)' : '#6366F1'}
                    strokeWidth={1.8}
                    fill={latestPoint.memory >= 80 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.12)'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. P95 Request Duration vs SLO Limit */}
          <div style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                P95 Latency vs. SLO ({threshold}ms)
              </span>
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: isBreached ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
                {latestPoint.latency}ms
              </span>
            </div>
            <div style={{ width: '100%', height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(37, 43, 52, 0.6)" />
                  <XAxis dataKey="time" stroke="#4B5563" fontSize={10} tickLine={false} />
                  <YAxis stroke="#4B5563" fontSize={10} domain={[0, 'dataMax + 80']} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#11151B', border: '1px solid #252B34', borderRadius: 4, fontSize: '11px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <ReferenceLine
                    y={threshold}
                    label={{ value: `SLO (${threshold}ms)`, fill: '#EF4444', fontSize: 9, position: 'top' }}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    name="P95 Latency"
                    stroke={isBreached ? 'var(--status-critical)' : 'var(--status-healthy)'}
                    strokeWidth={1.8}
                    fill={isBreached ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.12)'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsChartPanel;
