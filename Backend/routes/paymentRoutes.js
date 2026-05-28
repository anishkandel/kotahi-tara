const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Pool = require('../models/Pool');
const Contribution = require('../models/Contribution');
const { auth } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const router = express.Router();
const createNotification = require('../utils/createNotification');


// POST /api/payment/create-checkout-session
// Creates a Stripe checkout session for joining a pool
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin')
      return res.status(403).json({ message: 'Admins cannot join pools' });
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
              name: `${pool.title}  Pool Entry`,
              description: pool.description || `Contribute $${pool.contributionAmount} for a chance to win!`,
              images: pool.imageUrl ? [pool.imageUrl] : [],
            },
            unit_amount: Math.round(pool.contributionAmount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pools/${poolId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
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

// POST /api/payment/create-payment-intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { poolId } = req.body;

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    if (pool.status === 'completed')
      return res.status(400).json({ message: 'Pool is already completed' });

    const existing = await Contribution.findOne({ user: req.user.id, pool: poolId });
    if (existing)
      return res.status(400).json({ message: 'You have already joined this pool' });

    if (pool.contributionAmount < 1)
      return res.status(400).json({ message: 'Contribution amount must be at least $1 NZD' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pool.contributionAmount * 100),
      currency: 'nzd',
      metadata: {
        poolId: poolId.toString(),
        userId: req.user.id.toString(),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// POST /api/payment/confirm-contribution
router.post('/confirm-contribution', auth, async (req, res) => {
  try {
    const { poolId, paymentIntentId } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded')
      return res.status(400).json({ message: 'Payment not confirmed' });

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ message: 'Pool not found' });

    // Check not already saved
    let contribution = await Contribution.findOne({ user: req.user.id, pool: poolId });
    if (!contribution) {
      contribution = new Contribution({
        user: req.user.id,
        pool: poolId,
        amount: pool.contributionAmount,
      });
      await contribution.save();

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
      await pool.save();

      //  Notify all contributors
      await Promise.all(allContributions.map(c =>
        createNotification({
          recipient: c.user,
          type: 'pool_completed',
          title: `Pool "${pool.title}" is Complete`,
          message: `The winner has been announced! Winning ticket: ${pool.winningTicket}`,
          link: `/pools/${pool._id}`
        })
      ));

      //  Notify winner
      await createNotification({
        recipient: winnerContribution.user,
        type: 'pool_won',
        title: `🏆 You Won "${pool.title}"!`,
        message: `Congratulations! Your ticket ${pool.winningTicket} was selected. Contact admin: ${pool.adminContact || 'See pool page'}`,
        link: `/pools/${pool._id}`
      });

      //  Notify admins
      const admins = await User.find({ role: 'admin' });
      await Promise.all(admins.map(admin =>
        createNotification({
          recipient: admin._id,
          type: 'pool_completed',
          title: `Pool "${pool.title}" Winner Auto-Selected`,
          message: `Pool reached target. Winner ticket: ${pool.winningTicket}`,
          link: `/pools/${pool._id}`
        })
      ));

    } else {
      //  Non-instant  just complete pool, notify contributors
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
      // ADD — notify admins
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
    // Pool not yet complete  just save
    await pool.save();
  }
}
res.json({ success: true, ticketCode: contribution.ticketCode, poolId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error confirming contribution' });
  }
});

// POST /api/payment/create-donation-checkout
router.post('/create-donation-checkout', auth, async (req, res) => {
  try {
    const { campaignId, amount, message, isAnonymous } = req.body;

    const Campaign = require('../models/Campaign');
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (amount < 1) return res.status(400).json({ message: 'Minimum donation is $1' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'nzd',
          product_data: {
            name: `Donation  ${campaign.title}`,
            description: `Supporting: ${campaign.description?.slice(0, 100)}`,
            images: campaign.imageUrl ? [campaign.imageUrl] : [],
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/donate/${campaignId}?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/donate/${campaignId}`,
      metadata: {
        campaignId: campaignId.toString(),
        userId: req.user.id.toString(),
        amount: amount.toString(),
        message: message || '',
        isAnonymous: isAnonymous ? 'true' : 'false',
        type: 'donation'
      }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create donation checkout' });
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

      console.log(` Payment confirmed  User ${userId} joined pool ${poolId}`);
    } catch (err) {
      console.error('Error processing webhook:', err);
    }
  }

  res.status(200).json({ received: true });
});

// GET /api/payment/success?session_id=xxx
//
router.get('/success', auth, async (req, res) => {
  try {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const { type, userId } = session.metadata;

    // --- DONATION FLOW ---
    if (type === 'donation') {
      const Campaign = require('../models/Campaign');
      const Donation = require('../models/Donation');
      const { campaignId, amount, message, isAnonymous } = session.metadata;

      let donation = await Donation.findOne({
        stripePaymentIntentId: session.payment_intent
      });

      if (!donation) {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

        donation = await Donation.create({
          campaign: campaignId,
          donor: userId,
          amount: Number(amount),
          message: message || '',
          isAnonymous: isAnonymous === 'true',
          stripePaymentIntentId: session.payment_intent
        });

        campaign.totalRaised += Number(amount);
        if (campaign.totalRaised >= campaign.goalAmount) campaign.status = 'completed';
        await campaign.save();
  //Send donation confirmation email (no emailNotifications check)
        const donor = await User.findById(userId);
        if (donor) {
          await sendEmail({
            to: donor.email,
            subject: '❤️ Donation Confirmed - Kotahi Tāra',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00FFB2;">Thank You for Your Donation! ❤️</h2>
                <p>Kia Ora ${donor.name},</p>
                <p>Your donation of <strong>$${amount} NZD</strong> to <strong>${campaign.title}</strong> was successful.</p>
                <p>Your generosity makes a real difference. Thank you for supporting this cause.</p>
                <a href="${process.env.FRONTEND_URL}/donate/${campaignId}"
                  style="display:inline-block; padding:12px 24px; background:#00FFB2; color:#000; font-weight:bold; border-radius:8px; text-decoration:none; margin-top:16px;">
                  View Campaign
                </a>
                <p style="color:#999; margin-top:24px; font-size:12px;">Kotahi Tāra  Contribute small, win big</p>
              </div>
            `
          });
        }
      }

      return res.json({ success: true, type: 'donation', campaignId });
    }

// --- POOL FLOW ---
const { poolId } = session.metadata;
let contribution = await Contribution.findOne({ user: userId, pool: poolId });

if (!contribution) {
  const pool = await Pool.findById(poolId);
  if (!pool) return res.status(404).json({ message: 'Pool not found' });

  contribution = new Contribution({
    user: userId,
    pool: poolId,
    amount: pool.contributionAmount,
  });
  await contribution.save();

  pool.totalContributed += pool.contributionAmount;

  // ✅ FIXED — only select winner if target is reached
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
      await pool.save();

      // Notify all contributors
      await Promise.all(allContributions.map(c =>
        createNotification({
          recipient: c.user,
          type: 'pool_completed',
          title: `Pool "${pool.title}" is Complete`,
          message: `The winner has been announced! Winning ticket: ${pool.winningTicket}`,
          link: `/pools/${pool._id}`
        })
      ));

      // Notify winner
      await createNotification({
        recipient: winnerContribution.user,
        type: 'pool_won',
        title: `You Won "${pool.title}"!`,
        message: `Congratulations! Your ticket ${pool.winningTicket} was selected. Contact admin: ${pool.adminContact || 'See pool page'}`,
        link: `/pools/${pool._id}`
      });

      // Notify admins
      const admins = await User.find({ role: 'admin' });
      await Promise.all(admins.map(admin =>
        createNotification({
          recipient: admin._id,
          type: 'pool_completed',
          title: `Pool "${pool.title}" Winner Auto-Selected`,
          message: `Pool reached target. Winner ticket: ${pool.winningTicket}`,
          link: `/pools/${pool._id}`
        })
      ));

    } else {
      // Non-instant — complete pool and notify
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
    }

  } else {
    // Pool not full yet — just save
    await pool.save();
  }
}

res.json({ success: true, ticketCode: contribution.ticketCode, poolId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});
module.exports = router;