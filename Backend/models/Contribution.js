const Pool = require("../models/Pool");

const contributeToPool = async (req, res) => {
  try {
    const poolId = req.params.id;
    const { amount } = req.body;

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ message: "Pool not found" });

    // Update total contributed
    pool.totalContributed += amount;

    // If target reached, close pool
    if (pool.totalContributed >= pool.targetAmount) {
      pool.status = "completed";
    }

    await pool.save();

    res.json({
      message: "Contribution added",
      pool
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { contributeToPool };
