const express = require('express');
const Contribution = require('../models/Contribution');
const Pool = require('../models/Pool');
const { auth } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const createNotification = require('../utils/createNotification');
const router = express.Router();

// POST /api/contributions  join a pool
router.post('/', auth, async (req, res) => {
  try {
    const { poolId } = req.body;

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (pool.status === 'completed')
      return res.status(400).json({ message: 'Pool is already completed' });

    const existing = await Contribution.findOne({ user: req.user.id, pool: poolId });
    if (existing)
      return res.status(400).json({ message: 'You have already joined this pool' });

    const amount = pool.contributionAmount;

    const contribution = new Contribution({
      user: req.user.id,
      pool: poolId,
      amount
    });
    await contribution.save();

    // Update pool total
    pool.totalContributed += amount;

    if (pool.totalContributed >= pool.targetAmount) {
      pool.status = 'completed';

      //  FIXED  instant mode winner selection with full notifications
      if (pool.winnerReleaseMode === 'instant') {
        const allContributions = await Contribution.find({ pool: pool._id });
        const randomIndex = Math.floor(Math.random() * allContributions.length);
        const winnerContribution = allContributions[randomIndex];

        pool.winner = winnerContribution.user;
        pool.winningTicket = winnerContribution.ticketCode;
        pool.winnerSelectedAt = new Date();
        pool.winnerPublished = true;

        await pool.save();

        //  Notify ALL contributors
        await Promise.all(allContributions.map(c =>
          createNotification({
            recipient: c.user,
            type: 'pool_completed',
            title: `Pool "${pool.title}" is Complete`,
            message: `The winner has been announced! Winning ticket: ${pool.winningTicket}`,
            link: `/pools/${pool._id}`
          })
        ));

        //  Notify winner specifically
        await createNotification({
          recipient: winnerContribution.user,
          type: 'pool_won',
          title: `🏆 You Won "${pool.title}"!`,
          message: `Congratulations! Your ticket ${pool.winningTicket} was selected. Contact admin: ${pool.adminContact || 'See pool page'}`,
          link: `/pools/${pool._id}`
        });

        // Notify admins
        const admins = await User.find({ role: 'admin' });
        await Promise.all(admins.map(admin =>
          createNotification({
            recipient: admin._id,
            type: 'pool_completed',
            title: `Pool "${pool.title}"Winner Auto-Selected`,
            message: `Pool reached target. Winner ticket: ${pool.winningTicket}`,
            link: `/pools/${pool._id}` 
          })
        ));

      } else {
        //  Non-instant  just save pool, notify contributors pool is complete
        await pool.save();

        const allContributions = await Contribution.find({ pool: pool._id });
        await Promise.all(allContributions.map(c =>
          createNotification({
            recipient: c.user,
            type: 'pool_completed',
            title: `Pool "${pool.title}" is Complete`,
            message: pool.winnerReleaseMode === 'scheduled' && pool.scheduledReleaseTime
              ? `Winner will be announced on ${new Date(pool.scheduledReleaseTime).toLocaleString()}`
              : 'The winner will be announced soon by the admin.',
            link: `/pools/${pool._id}`
          })
        ));
         const admins = await User.find({ role: 'admin' });
         await Promise.all(admins.map(admin =>
            createNotification({
              recipient: admin._id,
              type: 'pool_completed',
              title: `Pool "${pool.title}" is Ready`,
              message: `Pool has reached its target. Please select and publish the winner.`,
              link: `/pools/${pool._id}`
            })
          ));
      }
    } else {
      await pool.save();
    }

    //  Send pool entry confirmation email to user who just joined
    const user = await User.findById(req.user.id);
    if (user) {
      await sendEmail({
        to: user.email,
        subject: '🎫 Pool Entry Confirmed - Kotahi Tāra',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00FFB2;">You're In! 🎫</h2>
            <p>Kia Ora ${user.name},</p>
            <p>You have successfully joined <strong>${pool.title}</strong>.</p>
            <p>Your ticket code: <strong style="color: #00FFB2; font-family: monospace; font-size: 18px;">${contribution.ticketCode}</strong></p>
            <p>Good luck! 🍀</p>
            <a href="${process.env.FRONTEND_URL}/pools/${pool._id}"
              style="display:inline-block; padding:12px 24px; background:#00FFB2; color:#000; font-weight:bold; border-radius:8px; text-decoration:none; margin-top:16px;">
              View Pool
            </a>
            <p style="color:#999; margin-top:24px; font-size:12px;">Kotahi Tāra  Contribute small, win big</p>
          </div>
        `
      });
    }

    res.status(201).json({
      message: 'Successfully joined pool!',
      ticketCode: contribution.ticketCode,
      contribution,
      pool
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error joining pool' });
  }
});

// GET /api/contributions/my  logged in user's contributions
router.get('/my', auth, async (req, res) => {
  try {
    const contributions = await Contribution.find({ user: req.user.id })
      .populate('pool', 'title status targetAmount totalContributed contributionAmount winner winningTicket winnerPublished adminContact imageUrl images winnerReleaseMode scheduledReleaseTime')
      .sort({ createdAt: -1 });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your contributions' });
  }
});

// GET /api/contributions/pool/:poolId  all contributors for a pool
router.get('/pool/:poolId', async (req, res) => {
  try {
    const contributions = await Contribution.find({ pool: req.params.poolId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contributions' });
  }
});

module.exports = router;