const axios = require('axios');

const aiServiceError = (message, cause) => {
  const error = new Error(message);
  error.code = 'AI_SERVICE_UNAVAILABLE';
  error.statusCode = 503;
  error.cause = cause;
  return error;
};

class AIServiceClient {
  get baseUrl() {
    return process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async predict(telemetry) {
    try {
      const response = await axios.post(`${this.baseUrl}/predict`, telemetry, { timeout: Number(process.env.AI_SERVICE_TIMEOUT_MS || 4000) });
      return response.data;
    } catch (err) {
      throw aiServiceError(`AI prediction service unavailable: ${err.message}`, err);
    }
  }

  async analyzeCopilotState({ serviceName, namespace = 'default', telemetry, logs = '', events = '', recentDeploymentInfo = 'v1.0', podState = '' }) {
    try {
      const response = await axios.post(`${this.baseUrl}/copilot/analyze`, {
        service_name: serviceName,
        namespace,
        telemetry,
        logs,
        events,
        recent_deployment_info: recentDeploymentInfo,
        pod_state: podState,
      }, { timeout: Number(process.env.AI_SERVICE_TIMEOUT_MS || 6000) });
      return response.data;
    } catch (err) {
      const detail = err.response?.data?.detail;
      const error = aiServiceError(`AI analysis service unavailable: ${err.message}`, err);
      if (detail?.code === 'LLM_UNAVAILABLE') error.code = 'LLM_UNAVAILABLE';
      throw error;
    }
  }
}

module.exports = new AIServiceClient();
