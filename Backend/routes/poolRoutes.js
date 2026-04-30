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

// GET /api/pools/:id — single pool with winner populated (public)
router.get('/:id', async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id).populate('winner', 'name email'); // 🆕 populated
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pool' });
  }
});

// POST /api/pools — create pool (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { title, description, targetAmount, contributionAmount, imageUrl } = req.body;
    if (!title || !targetAmount || !contributionAmount) {
      return res.status(400).json({ message: 'title, targetAmount and contributionAmount are required' });
    }
    const pool = await Pool.create({ title, description, targetAmount, contributionAmount, imageUrl });
    res.status(201).json(pool);
  } catch (err) {
    res.status(500).json({ message: 'Error creating pool' });
  }
});

// PUT /api/pools/:id — update pool (admin only) 🆕
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    res.json(pool);
  } catch (err) {
    res.status(500).json({ message: 'Error updating pool' });
  }
});

// DELETE /api/pools/:id — delete pool + its contributions (admin only) 🆕
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findByIdAndDelete(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });
    await Contribution.deleteMany({ pool: req.params.id }); // 🆕 cleanup
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

    if (pool.winner) // 🆕 prevent re-picking
      return res.status(400).json({ message: 'Winner already selected for this pool' });

    const contributions = await Contribution.find({ pool: pool._id });
    if (contributions.length === 0)
      return res.status(400).json({ message: 'No contributions yet' });

    const randomIndex = Math.floor(Math.random() * contributions.length);
    pool.winner = contributions[randomIndex].user;
    pool.status = 'completed';
    await pool.save();

    const populatedPool = await Pool.findById(pool._id).populate('winner', 'name email'); // 🆕 populated

    res.json({ message: 'Winner selected!', winner: populatedPool.winner, pool: populatedPool });
  } catch (err) {
    res.status(500).json({ message: 'Error selecting winner' });
  }
});

module.exports = router;