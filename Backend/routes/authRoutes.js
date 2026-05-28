const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth, isAdmin } = require("../middleware/authMiddleware");
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password: hash,
      role: role || 'user',
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000
    });

    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: 'Verify your Kotahi Tāra account',
      html: `
        <h2>Kia Ora ${name},</h2>
        <p>Thanks for signing up to Kotahi Tāra.</p>
        <p>Please verify your email by clicking the button below:</p>
        <a href="${verifyLink}" style="background:#00FFB2;color:#000;padding:10px 16px;text-decoration:none;border-radius:6px;font-weight:bold;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `
    });

    res.status(201).json({
      message: 'User registered. Please check your email to verify your account.',
      userId: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// VERIFY EMAIL TOKEN
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;

    await user.save();

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = generateResetCode();

    user.resetPasswordCode = code;
    user.resetPasswordCodeExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    res.json({
      message: 'Reset code generated successfully',
      code
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET ALL USERS
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// RESEND VERIFICATION EMAIL
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: 'New verification link - Kotahi Tāra',
      html: `
        <h2>Kia Ora ${user.name},</h2>
        <p>Here is your new email verification link:</p>
        <a href="${verifyLink}" style="background:#00FFB2;color:#000;padding:10px 16px;text-decoration:none;border-radius:6px;font-weight:bold;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `
    });

    res.json({ message: 'A new verification email has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;