const axios = require('axios');

const telemetryError = (message, cause, code = 'PROMETHEUS_UNAVAILABLE') => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 503;
  error.cause = cause;
  return error;
};

const getPrometheusUrl = () => process.env.PROMETHEUS_URL || 'http://localhost:9090';
const telemetryWindow = () => process.env.PROMETHEUS_TELEMETRY_WINDOW || '5m';
const escapePromLabelValue = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
const serviceSelector = (service) => (process.env.PROMETHEUS_SERVICE_SELECTOR_TEMPLATE || 'job="%SERVICE%"')
  .replaceAll('%SERVICE%', escapePromLabelValue(service.deploymentName || service.name))
  .replaceAll('%NAMESPACE%', escapePromLabelValue(service.namespace));

const queryInstant = async (promQLExpression) => {
  try {
    const response = await axios.get(`${getPrometheusUrl()}/api/v1/query`, {
      params: { query: promQLExpression },
      timeout: Number(process.env.PROMETHEUS_TIMEOUT_MS || 1500),
    });
    const result = response.data?.data?.result;
    if (!Array.isArray(result) || result.length === 0) throw telemetryError('Prometheus returned no telemetry for the requested query.', null, 'PROMETHEUS_NO_DATA');
    return result;
  } catch (err) {
    if (err.code === 'PROMETHEUS_NO_DATA') throw err;
    throw telemetryError('Prometheus telemetry is unavailable.', err);
  }
};

const queryRange = async (promQLExpression, start, end, step = '15s') => {
  try {
    const response = await axios.get(`${getPrometheusUrl()}/api/v1/query_range`, {
      params: { query: promQLExpression, start, end, step },
      timeout: Number(process.env.PROMETHEUS_TIMEOUT_MS || 1500),
    });
    const result = response.data?.data?.result;
    if (!Array.isArray(result) || result.length === 0) throw telemetryError('Prometheus returned no telemetry for the requested range.', null, 'PROMETHEUS_NO_DATA');
    return result;
  } catch (err) {
    if (err.code === 'PROMETHEUS_NO_DATA') throw err;
    throw telemetryError('Prometheus telemetry is unavailable.', err);
  }
};

const checkSLO = async ({ queryExpression, threshold, comparator }) => {
  const result = await queryInstant(queryExpression);
  const value = Number(result[0]?.value?.[1]);
  if (!Number.isFinite(value)) throw telemetryError('Prometheus returned a non-numeric telemetry value.', null, 'PROMETHEUS_INVALID_DATA');
  const comparisons = { '<': value < threshold, '<=': value <= threshold, '>': value > threshold, '>=': value >= threshold, '==': value === threshold };
  if (!(comparator in comparisons)) {
    const error = new Error(`Unsupported SLO comparator: ${comparator}`);
    error.statusCode = 400;
    throw error;
  }
  return { status: comparisons[comparator] ? 'met' : 'violated', value };
};

const parsePrometheusMetric = (result) => {
  if (!Array.isArray(result) || result.length === 0) return null;
  const sample = result[0]?.value;
  const value = Number(sample?.[1]);
  if (!Number.isFinite(value)) return null;
  return { timestamp: new Date(Number(sample[0]) * 1000).toISOString(), value, labels: result[0].metric || {} };
};

const metricDefinition = (name, query) => ({ name, query });

const buildMetricDefinitions = (service) => {
  const selector = serviceSelector(service);
  const window = telemetryWindow();
  const configured = (key, fallback) => process.env[key] || fallback;
  return [
    metricDefinition('cpu_usage_cores', configured('PROMQL_CPU_USAGE', `sum(rate(container_cpu_usage_seconds_total{namespace="${escapePromLabelValue(service.namespace)}",pod=~"${escapePromLabelValue(service.deploymentName)}-.+"}[${window}]))`)),
    metricDefinition('memory_usage_bytes', configured('PROMQL_MEMORY_USAGE', `sum(container_memory_working_set_bytes{namespace="${escapePromLabelValue(service.namespace)}",pod=~"${escapePromLabelValue(service.deploymentName)}-.+"})`)),
    metricDefinition('pod_restart_count', configured('PROMQL_POD_RESTARTS', `sum(kube_pod_container_status_restarts_total{namespace="${escapePromLabelValue(service.namespace)}",pod=~"${escapePromLabelValue(service.deploymentName)}-.+"})`)),
    metricDefinition('request_count', configured('PROMQL_REQUEST_COUNT', `sum(http_requests_total{${selector}})`)),
    metricDefinition('request_rate_per_second', configured('PROMQL_REQUEST_RATE', `sum(rate(http_requests_total{${selector}}[${window}]))`)),
    metricDefinition('error_rate_per_second', configured('PROMQL_ERROR_RATE', `sum(rate(http_requests_total{${selector},status=~"5.."}[${window}]))`)),
    metricDefinition('p95_request_latency_seconds', configured('PROMQL_P95_LATENCY', `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{${selector}}[${window}])) by (le))`)),
    metricDefinition('target_availability', configured('PROMQL_TARGET_AVAILABILITY', `sum(up{${selector}})`)),
  ];
};

const collectMetric = async (definition, service) => {
  try {
    let result;

    try {
      result = await queryInstant(definition.query);
    } catch (error) {
      // An absent 5xx series means zero observed errors, not missing telemetry.
      if (definition.name === 'error_rate_per_second' && error.code === 'PROMETHEUS_NO_DATA') {
        return {
          name: definition.name,
          query: definition.query,
          source: 'prometheus',
          available: true,
          timestamp: new Date().toISOString(),
          value: 0,
          labels: {},
        };
      }
      throw error;
    }

    const parsed = parsePrometheusMetric(result);

    if (!parsed) {
      return {
        name: definition.name,
        query: definition.query,
        source: 'prometheus',
        available: false,
        errorCode: 'PROMETHEUS_INVALID_DATA',
        message: 'Prometheus returned no numeric value.',
      };
    }

    return {
      name: definition.name,
      query: definition.query,
      source: 'prometheus',
      available: true,
      ...parsed,
    };
  } catch (error) {
    const missing =
      error.code === 'PROMETHEUS_NO_DATA' ||
      error.code === 'PROMETHEUS_INVALID_DATA';

    return {
      name: definition.name,
      query: definition.query,
      source: 'prometheus',
      available: false,
      errorCode: missing
        ? 'METRIC_UNAVAILABLE'
        : (error.code || 'PROMETHEUS_UNAVAILABLE'),
      ...(missing ? { sourceErrorCode: error.code } : {}),
      message: missing
        ? 'No usable Prometheus sample is available for this metric.'
        : 'Prometheus telemetry is unavailable.',
    };
  }
};

const collectServiceTelemetry = async (service) => {
  const definitions = buildMetricDefinitions(service);
  const metrics = await Promise.all(definitions.map((definition) => collectMetric(definition, service)));
  const unavailable = metrics.filter((metric) => !metric.available);
  const transportUnavailable = unavailable.length === metrics.length && unavailable.every((metric) => metric.errorCode === 'PROMETHEUS_UNAVAILABLE');
  return {
    available: !transportUnavailable,
    source: 'prometheus',
    timestamp: new Date().toISOString(),
    namespace: service.namespace,
    service: service.deploymentName || service.name,
    window: telemetryWindow(),
    metrics,
    ...(transportUnavailable ? { errorCode: 'PROMETHEUS_UNAVAILABLE', message: 'Prometheus telemetry is unavailable.' } : {}),
  };
};

module.exports = { queryInstant, queryRange, checkSLO, telemetryError, parsePrometheusMetric, buildMetricDefinitions, collectServiceTelemetry, escapePromLabelValue };
