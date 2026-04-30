const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String, default: '' },          // Image added
    targetAmount: { type: Number, required: true },
    contributionAmount: { type: Number, required: true, default: 1 },
    totalContributed: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'completed'], default: 'open' },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

// Auto-calculated progress %, included in JSON responses
poolSchema.virtual('progressPercent').get(function () {
  return Math.min(100, Math.round((this.totalContributed / this.targetAmount) * 100));
});

poolSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Pool', poolSchema);