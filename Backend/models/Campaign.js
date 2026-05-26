const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    story: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    images: [{ type: String }],
    goalAmount: { type: Number, required: true },
    totalRaised: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ['Education', 'Health', 'Environment', 'Animals', 'Community', 'Emergency', 'Other'],
      default: 'Other'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    adminNote: { type: String, default: '' },
    deadline: { type: Date, default: null },

    //  Proper pitch details
    organizationName: { type: String, default: '' },
    organizationWebsite: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    location: { type: String, default: '' },

    //  Documents (URLs — uploaded via Cloudinary)
    pitchDeckUrl: { type: String, default: '' },
    whitepaperUrl: { type: String, default: '' },
    legalDocUrl: { type: String, default: '' },
    supportingDocs: [{ type: String }], // extra docs

    //  How funds will be used
    fundUsage: { type: String, default: '' },

    //  Social proof
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
    }
  },
  { timestamps: true }
);

campaignSchema.virtual('progressPercent').get(function () {
  return Math.min(100, Math.round((this.totalRaised / this.goalAmount) * 100));
});

campaignSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema);