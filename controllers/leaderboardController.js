const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

// @desc    Get leaderboard (visible to all users)
// @route   GET /api/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find()
      .populate('userId', 'username email')
      .sort('-score')
      .lean();

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get or create leaderboard entry for user
// @route   GET /api/leaderboard/me
// @access  Private
exports.getMyLeaderboardEntry = async (req, res) => {
  try {
    let entry = await Leaderboard.findOne({ userId: req.user.id })
      .populate('userId', 'username email');

    if (!entry) {
      entry = await Leaderboard.create({ userId: req.user.id });
      await entry.populate('userId', 'username email');
    }

    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Get my leaderboard entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Initialize leaderboard entries for all users
// @route   POST /api/leaderboard/initialize
// @access  Private (Admin only)
exports.initializeLeaderboard = async (req, res) => {
  try {
    const users = await User.find();

    for (const user of users) {
      const exists = await Leaderboard.findOne({ userId: user._id });
      if (!exists) {
        await Leaderboard.create({ userId: user._id });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Leaderboard initialized for all users'
    });
  } catch (error) {
    console.error('Initialize leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to update leaderboard score
exports.updateLeaderboardScore = async (userId, isCompleted) => {
  try {
    let entry = await Leaderboard.findOne({ userId });

    if (!entry) {
      entry = await Leaderboard.create({ userId });
    }

    if (isCompleted) {
      await entry.addCompletedTask();
    } else {
      await entry.addIncompleteTask();
    }

    return entry;
  } catch (error) {
    console.error('Update leaderboard score error:', error);
    throw error;
  }
};
