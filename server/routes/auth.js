const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

// Public routes (no token needed)
router.post('/register', register);
router.post('/login', login);

// Private route (token required) — uses protect middleware
router.get('/me', protect, getMe);
// Find user by email (for adding members)
router.get('/find', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ email: req.query.email }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;