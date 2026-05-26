const express = require('express');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth, isAdmin } = require('../middleware/authMiddleware');
const createNotification = require('../utils/createNotification');
const User = require('../models/User');

const router = express.Router();

// PUT /api/campaigns/:id/approve — admin approves
// UPDATED — approve route
router.put('/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', adminNote: req.body?.adminNote || '' },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Notify campaign owner
   await createNotification({
    recipient: campaign.createdBy,
    type: 'campaign_approved',
    title: 'Campaign Approved!',
    message: `Your campaign "${campaign.title}" has been approved and is now live.`,
    link: `/donate/${campaign._id}`  // 
    });

    res.json({ message: 'Campaign approved!', campaign });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error approving campaign' });
  }
});

// PUT /api/campaigns/:id/reject — admin rejects
// UPDATED — reject route
router.put('/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', adminNote: req.body?.adminNote || '' },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Notify campaign owner
    await createNotification({
    recipient: campaign.createdBy,
    type: 'campaign_rejected',
    title: 'Campaign Needs Changes',
    message: `Your campaign "${campaign.title}" was not approved. Reason: ${req.body?.adminNote || 'See admin feedback.'}`,
    link: `/dashboard`  // this one is fine already
    });

    res.json({ message: 'Campaign rejected.', campaign });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting campaign' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    if (campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    if (campaign.status !== 'pending' && req.user.role !== 'admin')
      return res.status(400).json({ message: 'Can only edit pending campaigns' });

    const updated = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating campaign' });
  }
});

router.get('/pending', auth, isAdmin, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'pending' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending campaigns' });
  }
});

// GET /api/campaigns — get all approved campaigns (public)
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let query = { status: 'approved' };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'All') query.category = category;
    let sortOption = { createdAt: -1 };
    if (sort === 'progress') sortOption = { totalRaised: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    const campaigns = await Campaign.find(query)
      .populate('createdBy', 'name')
      .sort(sortOption);
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching campaigns' });
  }
});


// GET /api/campaigns/my — get current user's campaigns
router.get('/my', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your campaigns' });
  }
});

// ADD — GET /api/campaigns/all — admin only, all campaigns
router.get('/all', auth, isAdmin, async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all campaigns' });
  }
});

// GET /api/campaigns/:id — single campaign
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching campaign' });
  }
});

// POST /api/campaigns — any user can submit a campaign for approval
// UPDATED — POST / (submit campaign) — notify admins
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, goalAmount, ...rest } = req.body;
    if (!title || !description || !goalAmount)
      return res.status(400).json({ message: 'Title, description and goal amount are required' });

    const campaign = await Campaign.create({
      title, description, goalAmount, ...rest,
      createdBy: req.user.id,
      status: 'pending'
    });

    //  Notify all admins
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map(admin =>
      createNotification({
        recipient: admin._id,
        type: 'campaign_submitted',
        title: 'New Campaign Submission',
        message: `A new campaign "${title}" has been submitted for review.`,
        link: `/admin`
      })
    ));

    res.status(201).json({ message: 'Campaign submitted for review!', campaign });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating campaign' });
  }
});

// DELETE /api/campaigns/:id — admin deletes
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    await Donation.deleteMany({ campaign: req.params.id });
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting campaign' });
  }
});

// POST /api/campaigns/:id/donate — donate to campaign
router.post('/:id/donate', auth, async (req, res) => {
  try {
    const { amount, message, isAnonymous } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status !== 'approved') return res.status(400).json({ message: 'Campaign is not active' });
    if (!amount || amount < 1) return res.status(400).json({ message: 'Minimum donation is $1' });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'nzd',
      metadata: {
        campaignId: campaign._id.toString(),
        userId: req.user.id.toString(),
        type: 'donation'
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing donation' });
  }
});

// POST /api/campaigns/:id/confirm-donation — confirm after payment
router.post('/:id/confirm-donation', auth, async (req, res) => {
  try {
    const { paymentIntentId, amount, message, isAnonymous } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded')
      return res.status(400).json({ message: 'Payment not confirmed' });

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const donation = await Donation.create({
      campaign: campaign._id,
      donor: req.user.id,
      amount,
      message: message || '',
      isAnonymous: isAnonymous || false,
      stripePaymentIntentId: paymentIntentId
    });

    campaign.totalRaised += amount;
    if (campaign.totalRaised >= campaign.goalAmount) {
      campaign.status = 'completed';
    }
    await campaign.save();

    res.json({ success: true, donation, campaign });
  } catch (err) {
    res.status(500).json({ message: 'Error confirming donation' });
  }
});

// GET /api/campaigns/:id/donations — public donor list
router.get('/:id/donations', async (req, res) => {
  try {
    const donations = await Donation.find({ campaign: req.params.id })
      .populate('donor', 'name')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching donations' });
  }
});

module.exports = router;