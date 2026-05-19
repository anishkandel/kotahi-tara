const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Pool = require('../models/Pool');
const Contribution = require('../models/Contribution');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/payment/create-checkout-session
// Creates a Stripe checkout session for joining a pool
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { poolId } = req.body;

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (pool.status === 'completed')
      return res.status(400).json({ message: 'Pool is already completed' });

    // Stripe minimum is $1 NZD
    if (pool.contributionAmount < 1) {
    return res.status(400).json({ 
        message: 'Contribution amount must be at least $1 NZD to process payment.' 
    });
    }

    // Block duplicate joins
    const existing = await Contribution.findOne({ user: req.user.id, pool: poolId });
    if (existing)
      return res.status(400).json({ message: 'You have already joined this pool' });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'nzd',
            product_data: {
              name: `${pool.title} — Pool Entry`,
              description: pool.description || `Contribute $${pool.contributionAmount} for a chance to win!`,
              images: pool.imageUrl ? [pool.imageUrl] : [],
            },
            unit_amount: Math.round(pool.contributionAmount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pools/${poolId}`,
      metadata: {
        poolId: poolId.toString(),
        userId: req.user.id.toString(),
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// POST /api/payment/webhook
// Stripe calls this after successful payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { poolId, userId } = session.metadata;

    try {
      const pool = await Pool.findById(poolId);
      if (!pool) return res.status(404).json({ message: 'Pool not found' });

      // Check not already joined (safety check)
      const existing = await Contribution.findOne({ user: userId, pool: poolId });
      if (existing) return res.status(200).json({ received: true });

      // Create contribution
      const contribution = new Contribution({
        user: userId,
        pool: poolId,
        amount: pool.contributionAmount,
      });
      await contribution.save();

      // Update pool total
      pool.totalContributed += pool.contributionAmount;
      if (pool.totalContributed >= pool.targetAmount) {
        pool.status = 'completed';

        // Auto select winner if instant mode
        if (pool.winnerReleaseMode === 'instant') {
          const allContributions = await Contribution.find({ pool: pool._id });
          const randomIndex = Math.floor(Math.random() * allContributions.length);
          const winnerContribution = allContributions[randomIndex];
          pool.winner = winnerContribution.user;
          pool.winningTicket = winnerContribution.ticketCode;
          pool.winnerSelectedAt = new Date();
          pool.winnerPublished = true;
        }
      }
      await pool.save();

      console.log(`✅ Payment confirmed — User ${userId} joined pool ${poolId}`);
    } catch (err) {
      console.error('Error processing webhook:', err);
    }
  }

  res.status(200).json({ received: true });
});

// GET /api/payment/success?session_id=xxx
// Verify payment was successful
// GET /api/payment/success?session_id=xxx
router.get('/success', auth, async (req, res) => {
  try {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const { poolId, userId } = session.metadata;

    // Check if contribution already exists (webhook may have already saved it)
    let contribution = await Contribution.findOne({ user: userId, pool: poolId });

    if (!contribution) {
      const pool = await Pool.findById(poolId);
      if (!pool) return res.status(404).json({ message: 'Pool not found' });

      // Save contribution now
      contribution = new Contribution({
        user: userId,
        pool: poolId,
        amount: pool.contributionAmount,
      });
      await contribution.save();

      // Update pool total
      pool.totalContributed += pool.contributionAmount;
      if (pool.totalContributed >= pool.targetAmount) {
        pool.status = 'completed';

        if (pool.winnerReleaseMode === 'instant') {
          const allContributions = await Contribution.find({ pool: pool._id });
          const randomIndex = Math.floor(Math.random() * allContributions.length);
          const winnerContribution = allContributions[randomIndex];
          pool.winner = winnerContribution.user;
          pool.winningTicket = winnerContribution.ticketCode;
          pool.winnerSelectedAt = new Date();
          pool.winnerPublished = true;
        }
      }
      await pool.save();
    }

    res.json({
      success: true,
      ticketCode: contribution.ticketCode,
      poolId,
      pool: contribution.pool
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});
module.exports = router;