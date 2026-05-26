const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        // User notifications
        'campaign_approved', 'campaign_rejected',
        'startup_approved', 'startup_rejected',
        'donation_received', 'pool_won', 'pool_completed',
        // Admin notifications
        'campaign_submitted', 'startup_submitted'
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // e.g. /donate/campaignId
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);