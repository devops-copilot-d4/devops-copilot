// Trend-based lightweight AI failure prediction engine.
// Implements sliding-window slope regression to detect impending SLO breaches
// before they manifest as active violations.

const predictFailureTrend = ({ metricHistory, threshold, comparator = '<' }) => {
  if (!metricHistory || metricHistory.length < 3) {
    return {
      isPredictedViolation: false,
      riskScore: 0.1,
      estimatedTimeToBreachSec: null,
      recommendation: 'Insufficient data points for trend prediction',
    };
  }

  // Calculate simple linear regression slope over history
  const n = metricHistory.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  metricHistory.forEach((point, i) => {
    const val = typeof point === 'object' ? point.value : point;
    sumX += i;
    sumY += val;
    sumXY += i * val;
    sumXX += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const currentVal = typeof metricHistory[n - 1] === 'object' ? metricHistory[n - 1].value : metricHistory[n - 1];

  let isPredictedViolation = false;
  let estimatedTimeToBreachSec = null;
  let riskScore = 0.1;
  let recommendation = 'Metrics trending within normal bounds';

  if (comparator === '<' || comparator === '<=') {
    // Metric should stay UNDER threshold (e.g. latency, error rate)
    if (slope > 0 && currentVal < threshold) {
      const remainingMargin = threshold - currentVal;
      const stepsToBreach = remainingMargin / (slope || 1);
      estimatedTimeToBreachSec = Math.max(5, Math.round(stepsToBreach * 10));

      if (stepsToBreach <= 6) {
        // Impending breach within next 60 seconds
        isPredictedViolation = true;
        riskScore = Math.min(0.95, 0.6 + (1 / Math.max(1, stepsToBreach)) * 0.35);
        recommendation = `P95 latency trending upward at +${slope.toFixed(2)}ms/step. Projected to breach ${threshold}ms threshold in ~${estimatedTimeToBreachSec}s. Preemptive scale_up recommended.`;
      }
    } else if (currentVal >= threshold) {
      riskScore = 1.0;
      recommendation = `Active violation in progress: current value (${currentVal}) exceeds threshold (${threshold}).`;
    }
  } else if (comparator === '>' || comparator === '>=') {
    // Metric should stay ABOVE threshold (e.g. availability, throughput)
    if (slope < 0 && currentVal > threshold) {
      const remainingMargin = currentVal - threshold;
      const stepsToBreach = remainingMargin / (Math.abs(slope) || 1);
      estimatedTimeToBreachSec = Math.max(5, Math.round(stepsToBreach * 10));

      if (stepsToBreach <= 6) {
        isPredictedViolation = true;
        riskScore = Math.min(0.95, 0.6 + (1 / Math.max(1, stepsToBreach)) * 0.35);
        recommendation = `Availability trending downward at ${slope.toFixed(2)}%/step. Projected to breach ${threshold}% threshold in ~${estimatedTimeToBreachSec}s. Preemptive restart recommended.`;
      }
    }
  }

  return {
    isPredictedViolation,
    slope: parseFloat(slope.toFixed(3)),
    currentValue: currentVal,
    threshold,
    riskScore: parseFloat(riskScore.toFixed(2)),
    estimatedTimeToBreachSec,
    recommendation,
  };
};

module.exports = { predictFailureTrend };
