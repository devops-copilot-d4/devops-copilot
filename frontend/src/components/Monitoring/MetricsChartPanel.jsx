import React, { useCallback, useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { SimulationAPI } from '../../api/endpoints';

const MetricChart = ({ title, unit, dataKey, data, threshold, color }) => <div className="metric-chart"><div><span>{title}</span><b>{data.length ? `${data[data.length - 1][dataKey]}${unit}` : '—'}</b></div><div className="chart-area">{data.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><CartesianGrid strokeDasharray="2 2" stroke="#252B34" /><XAxis dataKey="time" tick={{ fill: '#9CA3AF', fontSize: 10 }} /><YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} width={32} /><Tooltip contentStyle={{ background: '#11151B', border: '1px solid #252B34', fontSize: 11 }} />{threshold != null && <ReferenceLine y={threshold} stroke="#EF4444" strokeDasharray="4 4" />}<Area type="monotone" dataKey={dataKey} stroke={color} fill={`${color}22`} strokeWidth={2} /></AreaChart></ResponsiveContainer> : <div className="chart-empty">No telemetry history</div>}</div></div>;

const MetricsChartPanel = ({ refreshKey }) => {
  const [data, setData] = useState([]);
  const [threshold, setThreshold] = useState(null);
  const [available, setAvailable] = useState(true);
  const load = useCallback(async () => {
    try {
      const response = await SimulationAPI.getMetrics();
      const metrics = Array.isArray(response.data?.metrics) ? response.data.metrics : [];
      const mapped = metrics.map((point, index) => ({ time: point.time || String(index + 1), cpu: Number(point.cpu), memory: Number(point.memory), latency: Number(point.latency), errorRate: Number(point.errorRate) })).filter((point) => Object.values(point).slice(1).every(Number.isFinite));
      setData(mapped); setThreshold(Number.isFinite(Number(response.data?.threshold)) ? Number(response.data.threshold) : null); setAvailable(true);
    } catch (_) { setData([]); setThreshold(null); setAvailable(false); }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  return <section className="card-panel"><div className="card-panel-header"><div><div className="eyebrow">Prometheus / telemetry</div><h2 className="panel-title">Operational signals</h2></div><button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button></div><div className="card-panel-body">{!available && <div className="unavailable-callout">Telemetry endpoint is unavailable. Charts remain empty rather than displaying estimated values.</div>}<div className="metrics-charts"><MetricChart title="CPU utilization" unit="%" dataKey="cpu" data={data} color="#06B6D4" /><MetricChart title="Memory utilization" unit="%" dataKey="memory" data={data} color="#6366F1" /><MetricChart title="P95 latency" unit=" ms" dataKey="latency" data={data} threshold={threshold} color="#22C55E" /></div></div></section>;
};
export default MetricsChartPanel;
