const express = require('express');
const Contribution = require('../models/Contribution');
const Pool = require('../models/Pool');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// JOIN pool
router.post('/', auth, async (req, res) => {
  try {
    const { poolId, amount } = req.body;

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (pool.status === 'completed')
      return res.status(400).json({ message: 'Pool already completed' });

    // Optional: enforce fixed $1 contribution
    // if (amount !== pool.contributionAmount)
    //   return res.status(400).json({ message: `Contribution must be exactly ${pool.contributionAmount}` });

    const contribution = await Contribution.create({
      user: req.user.id,
      pool: poolId,
      amount
    });

    pool.totalContributed += amount;
    await pool.save();

    res.status(201).json({ message: 'Contribution added', contribution });
  } catch (err) {
    res.status(500).json({ message: 'Error adding contribution' });
  }
});

module.exports = router;
