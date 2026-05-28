const express = require('express');
const Startup = require('../models/Startup');
const { auth, isAdmin } = require('../middleware/authMiddleware');
const createNotification = require('../utils/createNotification');
const router = express.Router();
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// POST /api/startups  submit a startup (any logged in user)
// UPDATED  POST / (submit startup)  notify admins
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

// GET /api/startups  all approved startups (public)
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

// ADD  GET /api/startups/all  admin only
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

// GET /api/startups/pending  admin only
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

// GET /api/startups/my  current user's startups
router.get('/my', auth, async (req, res) => {
  try {
    const startups = await Startup.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(startups);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your startups' });
  }
});

// GET /api/startups/:id  single startup (public)
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

// FIXED  approve startup
router.put('/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', adminNote: req.body?.adminNote || '' },
      { new: true }
    );
    if (!startup) return res.status(404).json({ message: 'Startup not found' });

    //  Get owner FIRST
    const owner = await User.findById(startup.createdBy);

    //  In-app notification
    await createNotification({
      recipient: startup.createdBy,
      type: 'startup_approved',
      title: 'Startup Approved! 🚀',
      message: `Your startup "${startup.title}" has been approved and is now listed.`,
      link: `/startups/${startup._id}`
    });

    //  Email  no emailNotifications check, just send
    if (owner) {
      await sendEmail({
        to: owner.email,
        subject: 'Startup Approved - Kotahi Tāra',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00FFB2;">Startup Approved! 🚀</h2>
            <p>Kia Ora ${owner.name},</p>
            <p>Your startup <strong>${startup.title}</strong> has been approved and is now listed on Kotahi Tāra.</p>
            <a href="${process.env.FRONTEND_URL}/startups/${startup._id}"
              style="display:inline-block; padding:12px 24px; background:#00FFB2; color:#000; font-weight:bold; border-radius:8px; text-decoration:none; margin-top:16px;">
              View Startup
            </a>
            <p style="color:#999; margin-top:24px; font-size:12px;">Kotahi Tāra  Contribute small, win big</p>
          </div>
        `
      });
    }

    res.json({ message: 'Startup approved!', startup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error approving startup' });
  }
});

// FIXED  reject startup
router.put('/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', adminNote: req.body?.adminNote || '' },
      { new: true }
    );
    if (!startup) return res.status(404).json({ message: 'Startup not found' });

    //  Get owner FIRST
    const owner = await User.findById(startup.createdBy);

    //  In-app notification
    await createNotification({
      recipient: startup.createdBy,
      type: 'startup_rejected',
      title: 'Startup Needs Changes',
      message: `Your startup "${startup.title}" was not approved. Reason: ${req.body?.adminNote || 'See admin feedback.'}`,
      link: `/dashboard`
    });

    //  Email
    if (owner) {
      await sendEmail({
        to: owner.email,
        subject: 'Startup Update - Kotahi Tāra',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff4444;">Startup Needs Changes</h2>
            <p>Kia Ora ${owner.name},</p>
            <p>Your startup <strong>${startup.title}</strong> was not approved.</p>
            <p><strong>Reason:</strong> ${req.body?.adminNote || 'Please check your dashboard for feedback.'}</p>
            <a href="${process.env.FRONTEND_URL}/dashboard"
              style="display:inline-block; padding:12px 24px; background:#00FFB2; color:#000; font-weight:bold; border-radius:8px; text-decoration:none; margin-top:16px;">
              View Dashboard
            </a>
            <p style="color:#999; margin-top:24px; font-size:12px;">Kotahi Tāra  Contribute small, win big</p>
          </div>
        `
      });
    }

    res.json({ message: 'Startup rejected.', startup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error rejecting startup' });
  }
});

// PUT /api/startups/:id  edit (owner or admin)
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

// DELETE /api/startups/:id  admin only
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Startup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Startup deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting startup' });
  }
});

module.exports = router;