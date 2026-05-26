const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String, default: '' },
    images: [{ type: String }],
    targetAmount: { type: Number, required: true },
    contributionAmount: { type: Number, required: true, default: 1 },
    totalContributed: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'completed'], default: 'open' },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    winningTicket: { type: String, default: null },       //  winning ticket code

    //  Admin contact for winner to reach out
    adminContact: { type: String, default: '' },

    //  Winner release settings
    winnerReleaseMode: {
      type: String,
      enum: ['instant', 'scheduled', 'manual'],
      default: 'manual'
    },
    scheduledReleaseTime: { type: Date, default: null },  //  for scheduled mode
    winnerPublished: { type: Boolean, default: false },   //  is winner visible publicly
    winnerSelectedAt: { type: Date, default: null },      //  when winner was picked
  },
  { timestamps: true }
);

poolSchema.virtual('progressPercent').get(function () {
  return Math.min(100, Math.round((this.totalContributed / this.targetAmount) * 100));
});

poolSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Pool', poolSchema);