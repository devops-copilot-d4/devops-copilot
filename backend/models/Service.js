const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    repoUrl: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    namespace: { type: String, default: 'default' }, // K8s namespace
    deploymentName: { type: String }, // K8s deployment name
    imageName: { type: String }, // Docker image built for this service
    status: {
      type: String,
      enum: ['pending', 'building', 'running', 'failed', 'unknown'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);

