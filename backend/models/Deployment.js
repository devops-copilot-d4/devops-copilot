const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commitSha: { type: String },
    buildStatus: {
      type: String,
      enum: ['queued', 'building', 'success', 'failed'],
      default: 'queued',
    },
    deployStatus: {
      type: String,
      enum: ['pending', 'deploying', 'running', 'failed', 'rolled_back'],
      default: 'pending',
    },
    logs: { type: String }, // raw build/deploy log text, used as input for AI RCA
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deployment', deploymentSchema);

