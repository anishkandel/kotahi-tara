const express = require('express');
const Pool = require('../models/Pool');
const Contribution = require('../models/Contribution');
const { auth, isAdmin } = require('../middleware/authMiddleware');
const createNotification = require('../utils/createNotification');
const router = express.Router();

// GET /api/pools — all pools with search + filter
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

// GET /api/pools — all pools (public)
router.get('/', async (req, res) => {
  try {
    const pools = await Pool.find().sort({ createdAt: -1 });
    res.json(pools);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pools' });
  }
});

// GET /api/pools/:id — single pool (public)
router.get('/:id', async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id).populate('winner', 'name email');
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pool' });
  }
});

// POST /api/pools — create pool (admin only)
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

// PUT /api/pools/:id — update pool (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: 'Error updating pool' });
  }
});

// DELETE /api/pools/:id — delete pool (admin only)
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




// POST /api/pools/:id/select-winner — pick random winner (admin only)
// UPDATED — select-winner route
router.post('/:id/select-winner', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (pool.winner)
      return res.status(400).json({ message: 'Winner already selected for this pool' });

    const contributions = await Contribution.find({ pool: pool._id });
    if (contributions.length === 0)
      return res.status(400).json({ message: 'No contributions yet' });

    const randomIndex = Math.floor(Math.random() * contributions.length);
    const winnerContribution = contributions[randomIndex];

    pool.winner = winnerContribution.user;
    pool.winningTicket = winnerContribution.ticketCode;
    pool.winnerSelectedAt = new Date();
    pool.status = 'completed';

    if (pool.winnerReleaseMode === 'instant') {
      pool.winnerPublished = true;
    } else {
      pool.winnerPublished = false;
    }

    await pool.save();

    // ✅ Notify ALL pool contributors that pool is completed
    await Promise.all(contributions.map(c =>
      createNotification({
        recipient: c.user,
        type: 'pool_completed',
        title: `Pool "${pool.title}" is Complete`,
        message: pool.winnerPublished
          ? `The winner has been announced! Winning ticket: ${pool.winningTicket}`
          : pool.winnerReleaseMode === 'scheduled' && pool.scheduledReleaseTime
            ? `Winner will be announced on ${new Date(pool.scheduledReleaseTime).toLocaleString()}`
            : 'The winner will be announced soon by the admin.',
        link: `/pools/${pool._id}`
      })
    ));

    // Notify the winner separately (only if published instantly)
    if (pool.winnerPublished) {
      await createNotification({
        recipient: winnerContribution.user,
        type: 'pool_won',
        title: `You Won "${pool.title}"!`,
        message: `Congratulations! Your ticket ${pool.winningTicket} was selected. Contact admin: ${pool.adminContact || 'See pool page'}`,
        link: `/pools/${pool._id}`
      });
    }

    const populatedPool = await Pool.findById(pool._id).populate('winner', 'name email');
    res.json({
      message: 'Winner selected!',
      winningTicket: pool.winningTicket,
      winner: populatedPool.winner,
      pool: populatedPool
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error selecting winner' });
  }
});

//  POST /api/pools/:id/publish-winner — admin publishes winner manually
// UPDATED — publish-winner route
router.post('/:id/publish-winner', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (!pool.winner)
      return res.status(400).json({ message: 'No winner selected yet.' });

    if (pool.winnerPublished)
      return res.status(400).json({ message: 'Winner already published' });

    pool.winnerPublished = true;
    await pool.save();

    // Notify all contributors that winner is now published
    const contributions = await Contribution.find({ pool: pool._id });
    await Promise.all(contributions.map(c =>
      createNotification({
        recipient: c.user,
        type: 'pool_completed',
        title: `"${pool.title} Winner Announced "`,
        message: `The winner has been announced! Winning ticket: ${pool.winningTicket}`,
        link: `/pools/${pool._id}`
      })
    ));

    // Notify the winner specifically
    await createNotification({
      recipient: pool.winner,
      type: 'pool_won',
      title: `You Won "${pool.title}"!`,
      message: `Congratulations! Your ticket ${pool.winningTicket} was selected. Contact admin: ${pool.adminContact || 'See pool page'}`,
      link: `/pools/${pool._id}`
    });

    const populatedPool = await Pool.findById(pool._id).populate('winner', 'name email');
    res.json({ message: 'Winner published successfully!', pool: populatedPool });
  } catch (err) {
    res.status(500).json({ message: 'Error publishing winner' });
  }
});

module.exports = router;