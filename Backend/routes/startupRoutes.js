const express = require('express');
const Startup = require('../models/Startup');
const { auth, isAdmin } = require('../middleware/authMiddleware');
const createNotification = require('../utils/createNotification');
const router = express.Router();

// POST /api/startups — submit a startup (any logged in user)
// UPDATED — POST / (submit startup) — notify admins
router.post('/', auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: 'Title and description are required' });

    const startup = await Startup.create({
      ...req.body,
      fundingGoal: Number(req.body.fundingGoal || 0),
      equityOffered: Number(req.body.equityOffered || 0),
      teamMembers: req.body.teamMembers?.filter(m => m.name?.trim() !== '') || [],
      createdBy: req.user.id,
      status: 'pending'
    });

    //  Notify all admins
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map(admin =>
      createNotification({
        recipient: admin._id,
        type: 'startup_submitted',
        title: 'New Startup Submission',
        message: `A new startup "${title}" has been submitted for review.`,
        link: `/admin`
      })
    ));

    res.status(201).json({ message: 'Startup submitted for review!', startup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting startup' });
  }
});

// GET /api/startups — all approved startups (public)
router.get('/', async (req, res) => {
  try {
    const { search, industry, stage } = req.query;
    let query = { status: 'approved' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } }
      ];
    }
    if (industry && industry !== 'All') query.industry = industry;
    if (stage && stage !== 'All') query.stage = stage;

    const startups = await Startup.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(startups);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching startups' });
  }
});

// ADD — GET /api/startups/all — admin only
router.get('/all', auth, isAdmin, async (req, res) => {
  try {
    const startups = await Startup.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(startups);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all startups' });
  }
});

// GET /api/startups/pending — admin only
router.get('/pending', auth, isAdmin, async (req, res) => {
  try {
    const startups = await Startup.find({ status: 'pending' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(startups);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending startups' });
  }
});

// GET /api/startups/my — current user's startups
router.get('/my', auth, async (req, res) => {
  try {
    const startups = await Startup.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(startups);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your startups' });
  }
});

// GET /api/startups/:id — single startup (public)
router.get('/:id', async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate('createdBy', 'name');
    if (!startup) return res.status(404).json({ message: 'Startup not found' });
    res.json(startup);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching startup' });
  }
});

// PUT /api/startups/:id/approve — admin approves
// UPDATED — approve startup
router.put('/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', adminNote: req.body?.adminNote || '' },
      { new: true }
    );
    if (!startup) return res.status(404).json({ message: 'Startup not found' });

    await createNotification({
      recipient: startup.createdBy,
      type: 'startup_approved',
      title: 'Startup Approved!',
      message: `Your startup "${startup.title}" has been approved and is now listed.`,
      link: `/startups/${startup._id}`
    });

    res.json({ message: 'Startup approved!', startup });
  } catch (err) {
    res.status(500).json({ message: 'Error approving startup' });
  }
});

// PUT /api/startups/:id/reject — admin rejects
// UPDATED — reject startup
router.put('/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', adminNote: req.body?.adminNote || '' },
      { new: true }
    );
    if (!startup) return res.status(404).json({ message: 'Startup not found' });

    await createNotification({
      recipient: startup.createdBy,
      type: 'startup_rejected',
      title: 'Startup Needs Changes',
      message: `Your startup "${startup.title}" was not approved. Reason: ${req.body?.adminNote || 'See admin feedback.'}`,
      link: `/dashboard`
    });

    res.json({ message: 'Startup rejected.', startup });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting startup' });
  }
});

// PUT /api/startups/:id — edit (owner or admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: 'Startup not found' });

    if (startup.createdBy.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    if (startup.status !== 'pending' && req.user.role !== 'admin')
      return res.status(400).json({ message: 'Can only edit pending startups' });

    const updated = await Startup.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating startup' });
  }
});

// DELETE /api/startups/:id — admin only
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Startup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Startup deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting startup' });
  }
});

module.exports = router;