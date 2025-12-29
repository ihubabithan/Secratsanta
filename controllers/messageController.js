const Message = require('../models/Message');
const Selection = require('../models/Selection');
const User = require('../models/User');
const { updateLeaderboardScore } = require('./leaderboardController');

// @desc    Create a message/task for selected participant
// @route   POST /api/messages
// @access  Private
exports.createMessage = async (req, res) => {
  try {
    const { taskDescription, deadline } = req.body;

    if (!taskDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a task description'
      });
    }

    // Check if user has selected someone
    const selection = await Selection.findOne({ giverUserId: req.user.id });

    if (!selection) {
      return res.status(400).json({
        success: false,
        message: 'You must select a participant before sending a message'
      });
    }

    // Decrypt receiver name and get receiver ID
    const receiverUsername = selection.getDecryptedReceiverName();
    const receiver = await User.findOne({ username: receiverUsername });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create message (always anonymous)
    const message = await Message.create({
      receiverId: receiver._id,
      taskDescription,
      deadline: deadline || null,
      isAnonymous: true
    });

    // Populate only receiver info (sender remains anonymous)
    await message.populate('receiverId', 'username email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: message
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all public tasks
// @route   GET /api/messages/public
// @access  Private
exports.getPublicTasks = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('receiverId', 'username email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get public tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get messages sent by current user
// @route   GET /api/messages/sent
// @access  Private
exports.getSentMessages = async (req, res) => {
  try {
    // Only populate receiver, keep sender anonymous
    const messages = await Message.find({ senderId: req.user.id })
      .populate('receiverId', 'username email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get messages received by current user
// @route   GET /api/messages/received
// @access  Private
exports.getReceivedMessages = async (req, res) => {
  try {
    // Don't populate sender to keep them anonymous
    const messages = await Message.find({ receiverId: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get received messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark task as completed (Admin only - abithan.p.ihub@snsgroups.com)
// @route   PUT /api/messages/:id/complete
// @access  Private (Admin only)
exports.markTaskComplete = async (req, res) => {
  try {
    const { password } = req.body;
    const taskId = req.params.id;

    // Check if user is admin
    if (req.user.email !== 'abithan.p.ihub@snsgroups.com') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only admin can mark tasks as complete.'
      });
    }

    // Verify password
    if (password !== '15963') {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    const task = await Message.findById(taskId).populate('receiverId');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Task already marked as completed'
      });
    }

    // Mark task as completed
    task.isCompleted = true;
    task.completedAt = Date.now();
    task.completedBy = 'admin';
    await task.save();

    // Update leaderboard (+5 points)
    await updateLeaderboardScore(task.receiverId._id, true);

    res.status(200).json({
      success: true,
      message: 'Task marked as completed',
      data: task
    });
  } catch (error) {
    console.error('Mark task complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark task as incomplete (Admin only - abithan.p.ihub@snsgroups.com)
// @route   PUT /api/messages/:id/incomplete
// @access  Private (Admin only)
exports.markTaskIncomplete = async (req, res) => {
  try {
    const { password } = req.body;
    const taskId = req.params.id;

    // Check if user is admin
    if (req.user.email !== 'abithan.p.ihub@snsgroups.com') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only admin can mark tasks as incomplete.'
      });
    }

    // Verify password
    if (password !== '15963') {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    const task = await Message.findById(taskId).populate('receiverId');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Mark task as incomplete
    task.markedIncompleteBy = req.user.id;
    task.markedIncompleteAt = Date.now();
    await task.save();

    // Update leaderboard (-5 points)
    await updateLeaderboardScore(task.receiverId._id, false);

    res.status(200).json({
      success: true,
      message: 'Task marked as incomplete. -5 points applied.',
      data: task
    });
  } catch (error) {
    console.error('Mark task incomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
