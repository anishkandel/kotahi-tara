const express = require('express');
const Pool = require('../models/Pool');
const Contribution = require('../models/Contribution');
const { auth, isAdmin } = require('../middleware/authMiddleware');
const createNotification = require('../utils/createNotification');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
// GET /api/pools  all pools with search + filter
router.get('/', async (req, res) => {
  try {
    const { search, category, status, poolType, sort } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (poolType && poolType !== 'All') query.poolType = poolType;

    // Build sort
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'progress') sortOption = { totalContributed: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'amount') sortOption = { contributionAmount: 1 };

    const pools = await Pool.find(query).sort(sortOption);
    res.json(pools);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pools' });
  }
});

// GET /api/pools  all pools (public)
router.get('/', async (req, res) => {
  try {
    const pools = await Pool.find().sort({ createdAt: -1 });
    res.json(pools);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pools' });
  }
});

// GET /api/pools/:id  single pool (public)
router.get('/:id', async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id).populate('winner', 'name email');
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pool' });
  }
});

// POST /api/pools  create pool (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const {
      title, description, targetAmount, contributionAmount,
      imageUrl, images, adminContact, winnerReleaseMode, scheduledReleaseTime
    } = req.body;

    if (!title || !targetAmount || !contributionAmount)
      return res.status(400).json({ message: 'title, targetAmount and contributionAmount are required' });

    const pool = await Pool.create({
      title, description, targetAmount, contributionAmount,
      imageUrl, images, adminContact,
      winnerReleaseMode: winnerReleaseMode || 'manual',
      scheduledReleaseTime: scheduledReleaseTime || null
    });

    res.status(201).json(pool);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating pool' });
  }
});

// PUT /api/pools/:id  update pool (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: 'Error updating pool' });
  }
});

// DELETE /api/pools/:id  delete pool (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findByIdAndDelete(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    await Contribution.deleteMany({ pool: req.params.id });
    res.json({ message: 'Pool deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting pool' });
  }
});




// FIXED  select-winner route with debug + admin notification
router.post('/:id/select-winner', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (pool.winner)
      return res.status(400).json({ message: 'Winner already selected for this pool' });

    const contributions = await Contribution.find({ pool: pool._id });
    if (contributions.length === 0)
      return res.status(400).json({ message: 'No contributions yet' });

    console.log(`🎲 Selecting winner from ${contributions.length} contributions`);
    console.log('Contributors:', contributions.map(c => c.user));

    const randomIndex = Math.floor(Math.random() * contributions.length);
    const winnerContribution = contributions[randomIndex];

    pool.winner = winnerContribution.user;
    pool.winningTicket = winnerContribution.ticketCode;
    pool.winnerSelectedAt = new Date();
    pool.status = 'completed';
    pool.winnerPublished = pool.winnerReleaseMode === 'instant';

    await pool.save();
    console.log(` Pool saved. Winner: ${pool.winner}, Published: ${pool.winnerPublished}`);

    //  Notify ALL contributors
    for (const c of contributions) {
      try {
        console.log(`📬 Notifying contributor: ${c.user}`);
        await createNotification({
          recipient: c.user,
          type: 'pool_completed',
          title: `Pool "${pool.title}" is Complete`,
          message: pool.winnerPublished
            ? `The winner has been announced! Winning ticket: ${pool.winningTicket}`
            : pool.winnerReleaseMode === 'scheduled' && pool.scheduledReleaseTime
              ? `Winner will be announced on ${new Date(pool.scheduledReleaseTime).toLocaleString()}`
              : 'The winner will be announced soon by the admin.',
          link: `/pools/${pool._id}`
        });
        console.log(` Notification sent to: ${c.user}`);
      } catch (notifErr) {
        console.error(`❌ Failed to notify ${c.user}:`, notifErr);
      }
    }

    //  Notify winner if instant
    if (pool.winnerPublished) {
      console.log(`🏆 Notifying winner: ${winnerContribution.user}`);
      await createNotification({
        recipient: winnerContribution.user,
        type: 'pool_won',
        title: `You Won "${pool.title}"!`,
        message: `Congratulations! Your ticket ${pool.winningTicket} was selected. Contact admin: ${pool.adminContact || 'See pool page'}`,
        link: `/pools/${pool._id}`
      });
    }

    //  Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        type: 'pool_completed',
        title: `Pool "${pool.title}"  Winner Selected`,
        message: `Winner selected: Ticket ${pool.winningTicket}. ${pool.winnerPublished ? 'Winner published.' : 'Awaiting manual publish.'}`,
        link: `/pools/${pool._id}`
      });
    }
    console.log(` Admin notifications sent to ${admins.length} admin(s)`);

    const populatedPool = await Pool.findById(pool._id).populate('winner', 'name email');
    res.json({
      message: 'Winner selected!',
      winningTicket: pool.winningTicket,
      winner: populatedPool.winner,
      pool: populatedPool
    });
  } catch (err) {
    console.error('❌ Error selecting winner:', err);
    res.status(500).json({ message: 'Error selecting winner' });
  }
});

// FIXED  publish-winner route with debug + admin notification
router.post('/:id/publish-winner', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    if (!pool.winner) return res.status(400).json({ message: 'No winner selected yet.' });
    if (pool.winnerPublished) return res.status(400).json({ message: 'Winner already published' });

    pool.winnerPublished = true;
    await pool.save();

    const contributions = await Contribution.find({ pool: pool._id });
    console.log(`📢 Publishing winner to ${contributions.length} contributors`);

    //  Notify all contributors
    for (const c of contributions) {
      try {
        await createNotification({
          recipient: c.user,
          type: 'pool_completed',
          title: `Winner Announced  "${pool.title}"`,
          message: `The winner has been announced! Winning ticket: ${pool.winningTicket}`,
          link: `/pools/${pool._id}`
        });
      } catch (notifErr) {
        console.error(`❌ Failed to notify ${c.user}:`, notifErr);
      }
    }

    //  Notify winner
    await createNotification({
      recipient: pool.winner,
      type: 'pool_won',
      title: `🏆 You Won "${pool.title}"!`,
      message: `Congratulations! Your ticket ${pool.winningTicket} was selected. Contact admin: ${pool.adminContact || 'See pool page'}`,
      link: `/pools/${pool._id}`
    });

    //  Email winner directly
    const winnerUser = await User.findById(pool.winner);
    if (winnerUser) {
      console.log(`📧 Sending winner email to: ${winnerUser.email}`);
      await sendEmail({
        to: winnerUser.email,
        subject: `🏆 You Won "${pool.title}" - Kotahi Tāra`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00FFB2;">Congratulations! You Won! 🏆</h2>
            <p>Kia Ora ${winnerUser.name},</p>
            <p>You won the pool <strong>${pool.title}</strong>!</p>
            <p>Your winning ticket: <strong style="color: #00FFB2; font-family: monospace;">${pool.winningTicket}</strong></p>
            ${pool.adminContact ? `<p>Contact admin to claim your prize: <strong>${pool.adminContact}</strong></p>` : ''}
            <a href="${process.env.FRONTEND_URL}/pools/${pool._id}"
              style="display:inline-block; padding:12px 24px; background:#00FFB2; color:#000; font-weight:bold; border-radius:8px; text-decoration:none; margin-top:16px;">
              View Pool
            </a>
            <p style="color:#999; margin-top:24px; font-size:12px;">Kotahi Tāra  Contribute small, win big</p>
          </div>
        `
      });
    }

    //  Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        type: 'pool_completed',
        title: `Winner Published  "${pool.title}"`,
        message: `Winner has been announced publicly. Winning ticket: ${pool.winningTicket}`,
        link: `/pools/${pool._id}`
      });
    }

    const populatedPool = await Pool.findById(pool._id).populate('winner', 'name email');
    res.json({ message: 'Winner published successfully!', pool: populatedPool });
  } catch (err) {
    console.error('❌ Error publishing winner:', err);
    res.status(500).json({ message: 'Error publishing winner' });
  }
});

module.exports = router;