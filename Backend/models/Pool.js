const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    targetAmount: { type: Number, required: true },
    contributionAmount: { type: Number, required: true },
    totalContributed: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'completed'], default: 'open' },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pool', poolSchema);
