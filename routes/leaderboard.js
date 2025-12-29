const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getLeaderboard,
  getMyLeaderboardEntry,
  initializeLeaderboard
} = require('../controllers/leaderboardController');

// @route   GET /api/leaderboard
router.get('/', protect, getLeaderboard);

// @route   GET /api/leaderboard/me
router.get('/me', protect, getMyLeaderboardEntry);

// @route   POST /api/leaderboard/initialize
router.post('/initialize', protect, initializeLeaderboard);

module.exports = router;
