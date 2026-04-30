const express = require('express');
const Contribution = require('../models/Contribution');
const Pool = require('../models/Pool');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/contributions — join a pool 🆕
router.post('/', auth, async (req, res) => {
  try {
    const { poolId } = req.body;

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (pool.status === 'completed')
      return res.status(400).json({ message: 'Pool is already completed' });

    // 🆕 Block duplicate joins
    const existing = await Contribution.findOne({ user: req.user.id, pool: poolId });
    if (existing)
      return res.status(400).json({ message: 'You have already joined this pool' });

    const amount = pool.contributionAmount; // 🆕 always use pool's fixed amount

    const contribution = await Contribution.create({
      user: req.user.id,
      pool: poolId,
      amount
    });

    // 🆕 Update pool total & auto-close if target hit
    pool.totalContributed += amount;
    if (pool.totalContributed >= pool.targetAmount) {
      pool.status = 'completed';
    }
    await pool.save();

    res.status(201).json({ message: 'Successfully joined pool!', contribution, pool });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error joining pool' });
  }
});

// GET /api/contributions/my — logged-in user's joined pools 🆕
router.get('/my', auth, async (req, res) => {
  try {
    const contributions = await Contribution.find({ user: req.user.id })
      .populate('pool', 'title status targetAmount totalContributed contributionAmount winner imageUrl')
      .sort({ createdAt: -1 });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your contributions' });
  }
});

// GET /api/contributions/pool/:poolId — all contributors for a pool 🆕
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