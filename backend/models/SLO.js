const mongoose = require('mongoose');

const sloSchema = new mongoose.Schema(
  {
    requirement: { type: mongoose.Schema.Types.ObjectId, ref: 'Requirement', required: true },
    metric: { type: mongoose.Schema.Types.ObjectId, ref: 'Metric', required: true },
    threshold: { type: Number, required: true }, // e.g. 300
    comparator: { type: String, enum: ['<', '<=', '>', '>=', '=='], default: '<' },
    unit: { type: String }, // e.g. "ms", "%", "req/s"
    status: { type: String, enum: ['met', 'violated', 'unknown'], default: 'unknown' },
    lastCheckedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SLO', sloSchema);

