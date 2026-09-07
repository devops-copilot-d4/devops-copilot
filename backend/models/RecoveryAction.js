const mongoose = require('mongoose');

const recoveryActionSchema = new mongoose.Schema(
  {
    incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    actionType: {
      type: String,
      enum: ['restart', 'rollback', 'scale_up', 'scale_down', 'recreate', 'alert_only'],
      required: true,
    },
    reason: { type: String }, // LLM explainability text: why this action was chosen
    requiresApproval: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending_approval', 'executing', 'success', 'failed', 'rejected'],
      default: 'pending_approval',
    },
    requirementVerified: { type: Boolean, default: false }, // post-recovery SLO check result
    mttr: { type: Number }, // Mean Time to Recover in seconds
    target: { type: mongoose.Schema.Types.Mixed },
    confidence: { type: Number, min: 0, max: 1 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    verificationResult: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecoveryAction', recoveryActionSchema);
