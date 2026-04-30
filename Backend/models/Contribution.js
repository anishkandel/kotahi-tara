const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pool: { type: mongoose.Schema.Types.ObjectId, ref: 'Pool', required: true },
    amount: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contribution', contributionSchema);