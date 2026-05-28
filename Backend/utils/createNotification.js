// utils/createNotification.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('./sendEmail');

const EMAIL_SUBJECTS = {
  campaign_approved: '✅ Campaign Approved - Kotahi Tāra',
  campaign_rejected: 'Campaign Update - Kotahi Tāra',
  campaign_submitted: 'New Campaign Submission - Kotahi Tāra',
  startup_approved: '🚀 Startup Approved - Kotahi Tāra',
  startup_rejected: 'Startup Update - Kotahi Tāra',
  startup_submitted: 'New Startup Submission - Kotahi Tāra',
  pool_won: '🏆 You Won a Pool - Kotahi Tāra',
  pool_completed: 'Pool Update - Kotahi Tāra',
  donation_received: '❤️ New Donation - Kotahi Tāra',
};

const createNotification = async ({ recipient, type, title, message, link = '' }) => {
  try {
    const notif = await Notification.create({ recipient, type, title, message, link });
    console.log('✅ Notification created:', notif._id, 'for recipient:', recipient);
  } catch (err) {
    console.error('❌ Failed to create notification:', err.message);
  }
};

module.exports = createNotification;