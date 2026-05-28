const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: {
      type: String
    },

    emailVerificationTokenExpires: {
      type: Date
    },

    resetPasswordCode: {
      type: String
    },

    resetPasswordCodeExpires: {
      type: Date
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);