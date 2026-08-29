import React, { useEffect, useState } from 'react';
import { MonitoringAPI } from '../../api/endpoints';

const SLOPanel = () => {
  const [slos, setSlos] = useState([]);

  useEffect(() => {
    MonitoringAPI.sloStatus()
      .then((res) => setSlos(res.data))
      .catch(() => setSlos([]));
  }, []);

  return (
    <div className="panel">
      <h3>SLO Status</h3>
      {slos.length === 0 && <p>No SLOs tracked yet.</p>}
      <ul>
        {slos.map((s) => (
          <li key={s._id}>
            {s.requirement?.text} -{' '}
            <strong style={{ color: s.status === 'violated' ? '#e05252' : '#4caf50' }}>
              {s.status}
            </strong>{' '}
            (threshold {s.comparator} {s.threshold} {s.unit})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SLOPanel;

