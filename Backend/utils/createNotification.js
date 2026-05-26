// utils/createNotification.js
const Notification = require('../models/Notification');

const createNotification = async ({ recipient, type, title, message, link = '' }) => {
  try {
    await Notification.create({ recipient, type, title, message, link });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

module.exports = createNotification; // must be exporting the function directly