const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "http_request_duration_seconds"
    source: { type: String, default: 'prometheus' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    queryExpression: { type: String }, // PromQL query used to fetch this metric
  },
  { timestamps: true }
);

module.exports = mongoose.model('Metric', metricSchema);

