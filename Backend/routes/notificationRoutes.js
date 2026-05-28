const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/notifications  get current user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching count' });
  }
});

// PUT /api/notifications/:id/read  mark one as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// PUT /api/notifications/read-all  mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error marking all as read' });
  }
});

// DELETE /api/notifications/:id  delete one
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

module.exports = router;