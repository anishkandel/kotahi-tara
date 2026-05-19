const express = require('express');
const Pool = require('../models/Pool');
const Contribution = require('../models/Contribution');
const { auth, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

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
router.post('/:id/select-winner', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (pool.winner)
      return res.status(400).json({ message: 'Winner already selected for this pool' });

    const contributions = await Contribution.find({ pool: pool._id });
    if (contributions.length === 0)
      return res.status(400).json({ message: 'No contributions yet' });

    // Pick random winner
    const randomIndex = Math.floor(Math.random() * contributions.length);
    const winnerContribution = contributions[randomIndex];

    pool.winner = winnerContribution.user;
    pool.winningTicket = winnerContribution.ticketCode;   // 🆕 save winning ticket
    pool.winnerSelectedAt = new Date();                   // 🆕 save time of selection
    pool.status = 'completed';

    // 🆕 Decide if published based on release mode
    if (pool.winnerReleaseMode === 'instant') {
      pool.winnerPublished = true;
    } else if (pool.winnerReleaseMode === 'scheduled' && pool.scheduledReleaseTime) {
      pool.winnerPublished = false; // will be published at scheduled time
    } else {
      pool.winnerPublished = false; // manual — admin publishes when ready
    }

    await pool.save();

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

// 🆕 POST /api/pools/:id/publish-winner — admin publishes winner manually
router.post('/:id/publish-winner', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (!pool.winner)
      return res.status(400).json({ message: 'No winner selected yet. Select a winner first.' });

    if (pool.winnerPublished)
      return res.status(400).json({ message: 'Winner already published' });

    pool.winnerPublished = true;
    await pool.save();

    const populatedPool = await Pool.findById(pool._id).populate('winner', 'name email');

    res.json({
      message: 'Winner published successfully!',
      pool: populatedPool
    });
  } catch (err) {
    res.status(500).json({ message: 'Error publishing winner' });
  }
});

module.exports = router;