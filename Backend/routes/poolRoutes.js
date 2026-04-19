const express = require('express');
const Pool = require('../models/Pool');
const Contribution = require('../models/Contribution');
const { auth, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// GET all pools
router.get('/', async (req, res) => {
  const pools = await Pool.find().sort({ createdAt: -1 });
  res.json(pools);
});

// CREATE pool (admin)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.create(req.body);
    res.status(201).json(pool);
  } catch (err) {
    res.status(500).json({ message: 'Error creating pool' });
  }
});

// GET single pool
router.get('/:id', async (req, res) => {
  const pool = await Pool.findById(req.params.id);
  if (!pool) return res.status(404).json({ message: 'Pool not found' });
  res.json(pool);
});
// USER: Contribute to a pool
router.post('/:id/contribute', auth, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    const { amount } = req.body;

    // Update total contributed
    pool.totalContributed += amount;

    // If target reached, close pool
    if (pool.totalContributed >= pool.targetAmount) {
      pool.status = 'completed';
    }

    await pool.save();

    res.json({
      message: 'Contribution added',
      pool
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding contribution' });
  }
});


// SELECT winner (admin)
router.post('/:id/select-winner', auth, isAdmin, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    const contributions = await Contribution.find({ pool: pool._id });

    if (contributions.length === 0)
      return res.status(400).json({ message: 'No contributions' });

    const randomIndex = Math.floor(Math.random() * contributions.length);
    const winner = contributions[randomIndex].user;

    pool.winner = winner;
    pool.status = 'completed';
    await pool.save();

    res.json({ message: 'Winner selected', winner });
  } catch (err) {
    res.status(500).json({ message: 'Error selecting winner' });
  }
});

module.exports = router;
