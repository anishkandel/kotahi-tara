const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  role: { type: String, default: '' },
  linkedin: { type: String, default: '' },
}, { _id: false });

const startupSchema = new mongoose.Schema(
  {
    // Basic
    title: { type: String, required: true },
    tagline: { type: String, default: '' },
    description: { type: String, required: true },
    story: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    images: [{ type: String }],

    // Business
    industry: {
      type: String,
      enum: ['Tech', 'Health', 'Finance', 'Education', 'Environment', 'Food', 'Retail', 'Other'],
      default: 'Other'
    },
    stage: {
      type: String,
      enum: ['Idea', 'MVP', 'Early Revenue', 'Growth', 'Scaling'],
      default: 'Idea'
    },
    fundingGoal: { type: Number, default: 0 },
    equityOffered: { type: Number, default: 0 }, // percentage e.g. 10 = 10%

    // Team
    teamMembers: [teamMemberSchema],

    // Documents
    pitchDeckUrl: { type: String, default: '' },
    whitepaperUrl: { type: String, default: '' },
    legalDocUrl: { type: String, default: '' },

    // Contact
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    website: { type: String, default: '' },
    location: { type: String, default: '' },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },

    // Meta
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Startup', startupSchema);