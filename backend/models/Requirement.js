const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema(
  {
    text: { type: String, required: true }, // original natural-language requirement
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Requirement', requirementSchema);

