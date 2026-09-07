import React, { useCallback, useEffect, useState } from 'react';
import { RecoveryAPI } from '../../api/endpoints';

const styleFor = (value = '') => ['success', 'recovery_verified'].includes(String(value).toLowerCase()) ? 'badge-healthy' : ['failed', 'recovery_failed', 'recovery_inconclusive'].includes(String(value).toLowerCase()) ? 'badge-critical' : 'badge-warning';
const SelfHealingPanel = ({ refreshKey }) => {
  const [actions, setActions] = useState(null);
  const load = useCallback(async () => { try { const result = await RecoveryAPI.list(); setActions(Array.isArray(result.data) ? result.data : []); } catch (_) { setActions(null); } }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  return <section className="card-panel"><div className="card-panel-header"><div><div className="eyebrow">Controlled recovery</div><h2 className="panel-title">Recovery audit trail</h2></div><button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button></div><div className="table-responsive"><table className="enterprise-table"><thead><tr><th>Time</th><th>Action</th><th>Target</th><th>Verification</th><th>Result</th></tr></thead><tbody>{actions === null && <tr><td colSpan="5" className="empty-cell">Recovery audit is unavailable. No recovery status is inferred.</td></tr>}{actions?.length === 0 && <tr><td colSpan="5" className="empty-cell">No recovery actions have been recorded.</td></tr>}{actions?.slice(0, 10).map((action) => <tr key={action._id}><td className="cell-muted font-mono">{action.createdAt ? new Date(action.createdAt).toLocaleString() : 'Unavailable'}</td><td className="cell-strong">{action.actionType || 'Unavailable'}</td><td><code>{action.target?.namespace && action.target?.deploymentName ? `${action.target.namespace}/${action.target.deploymentName}` : 'Unavailable'}</code></td><td><span className={`badge-pill ${styleFor(action.verificationResult)}`}>{action.verificationResult || 'Unavailable'}</span></td><td><span className={`badge-pill ${styleFor(action.status)}`}>{action.status || 'Unavailable'}</span></td></tr>)}</tbody></table></div></section>;
};
export default SelfHealingPanel;
