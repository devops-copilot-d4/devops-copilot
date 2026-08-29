const axios = require('axios');

const PROM_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

// Run an instant PromQL query, e.g. 'rate(http_requests_total[5m])'
const queryInstant = async (promQLExpression) => {
  const response = await axios.get(`${PROM_URL}/api/v1/query`, {
    params: { query: promQLExpression },
  });
  return response.data?.data?.result || [];
};

// Run a range query for trend-based prediction (Week 6)
const queryRange = async (promQLExpression, start, end, step = '15s') => {
  const response = await axios.get(`${PROM_URL}/api/v1/query_range`, {
    params: { query: promQLExpression, start, end, step },
  });
  return response.data?.data?.result || [];
};

// Given an SLO's metric query + threshold + comparator, check current status
const checkSLO = async ({ queryExpression, threshold, comparator }) => {
  const result = await queryInstant(queryExpression);
  if (!result.length) return { status: 'unknown', value: null };

  const value = parseFloat(result[0].value[1]);
  let met;
  switch (comparator) {
    case '<': met = value < threshold; break;
    case '<=': met = value <= threshold; break;
    case '>': met = value > threshold; break;
    case '>=': met = value >= threshold; break;
    case '==': met = value === threshold; break;
    default: met = false;
  }

  return { status: met ? 'met' : 'violated', value };
};

module.exports = { queryInstant, queryRange, checkSLO };

