const express = require('express');
const { upload } = require('../config/cloudinary');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/upload — upload image, returns URL
router.post('/', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: req.file.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;