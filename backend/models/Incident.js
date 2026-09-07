const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    slo: { type: mongoose.Schema.Types.ObjectId, ref: 'SLO' },
    type: {
      type: String,
      enum: ['predicted_violation', 'active_violation', 'build_failure', 'runtime_failure'],
      required: true,
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    rootCause: { type: String }, // LLM-generated explanation
    failureType: { type: String },
    probability: { type: Number, min: 0, max: 1 },
    risk: { type: String },
    evidence: { type: mongoose.Schema.Types.Mixed },
    rca: { type: mongoose.Schema.Types.Mixed },
    resolutionStatus: { type: String },
    confidence: { type: Number, min: 0, max: 1 }, // AI confidence score
    rawLogsSnapshot: { type: String },
    status: {
      type: String,
      enum: ['open', 'diagnosing', 'recovering', 'resolved', 'escalated'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', incidentSchema);
