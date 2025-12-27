const User = require('../models/User');
const Selection = require('../models/Selection');
const Message = require('../models/Message');

// @desc    Get available participants (not selected by anyone)
// @route   GET /api/selections/available
// @access  Private
exports.getAvailableParticipants = async (req, res) => {
  try {
    // Get all users
    const allUsers = await User.find({}, 'username email');

    // Get all selections and decrypt receiver names
    const selections = await Selection.find({});
    const selectedUsernames = selections.map(s => s.getDecryptedReceiverName());

    // Get current user
    const currentUser = await User.findById(req.user.id);

    // Filter out current user and already selected participants
    const available = allUsers.filter(user => 
      user.username !== currentUser.username && 
      !selectedUsernames.includes(user.username)
    );

    res.status(200).json({
      success: true,
      count: available.length,
      data: available
    });
  } catch (error) {
    console.error('Get available participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Automatically assign a random participant
// @route   POST /api/selections/auto-assign
// @access  Private
exports.autoAssignParticipant = async (req, res) => {
  try {
    // Check if user already made a selection
    const existingSelection = await Selection.findOne({ giverUserId: req.user.id });
    
    if (existingSelection) {
      return res.status(400).json({
        success: false,
        message: 'You have already selected a participant'
      });
    }

    // Get all users
    const allUsers = await User.find({}, 'username email');

    // Get all selections and decrypt receiver names
    const selections = await Selection.find({});
    const selectedUsernames = selections.map(s => s.getDecryptedReceiverName());

    // Get current user
    const currentUser = await User.findById(req.user.id);

    // Filter out current user and already selected participants
    const available = allUsers.filter(user => 
      user.username !== currentUser.username && 
      !selectedUsernames.includes(user.username)
    );

    if (available.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available participants to assign'
      });
    }

    // Randomly select one participant
    const randomIndex = Math.floor(Math.random() * available.length);
    const selectedParticipant = available[randomIndex];

    // Encrypt the receiver username
    const encryptedReceiverName = Selection.encryptReceiverName(selectedParticipant.username);

    // Create selection
    const selection = await Selection.create({
      giverUserId: req.user.id,
      encryptedReceiverName
    });

    res.status(201).json({
      success: true,
      message: 'Participant automatically assigned successfully',
      data: {
        _id: selection._id,
        giverUserId: selection.giverUserId,
        timestamp: selection.timestamp,
        assignedPerson: {
          username: selectedParticipant.username,
          email: selectedParticipant.email
        }
      }
    });
  } catch (error) {
    console.error('Auto assign participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Select a participant
// @route   POST /api/selections
// @access  Private
exports.selectParticipant = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { receiverUsername } = req.body;

    if (!receiverUsername) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a receiver username'
      });
    }

    // Check if user already made a selection
    const existingSelection = await Selection.findOne({ giverUserId: req.user.id });
    
    if (existingSelection) {
      return res.status(400).json({
        success: false,
        message: 'You have already selected a participant'
      });
    }

    // Encrypt the receiver username
    const encryptedReceiverName = Selection.encryptReceiverName(receiverUsername);

    // Check if receiver is already selected by someone else
    const receiverSelected = await Selection.findOne({ encryptedReceiverName });
    
    if (receiverSelected) {
      return res.status(400).json({
        success: false,
        message: 'This participant has already been selected'
      });
    }

    // Get current user to check they're not selecting themselves
    const currentUser = await User.findById(req.user.id);
    
    if (currentUser.username === receiverUsername) {
      return res.status(400).json({
        success: false,
        message: 'You cannot select yourself'
      });
    }

    // Check if receiver exists
    const receiver = await User.findOne({ username: receiverUsername });
    
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create selection
    const selection = await Selection.create({
      giverUserId: req.user.id,
      encryptedReceiverName
    });

    res.status(201).json({
      success: true,
      message: 'Participant selected successfully',
      data: {
        _id: selection._id,
        giverUserId: selection.giverUserId,
        timestamp: selection.timestamp
      }
    });
  } catch (error) {
    console.error('Select participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's selection
// @route   GET /api/selections/my-selection
// @access  Private
exports.getMySelection = async (req, res) => {
  try {
    const selection = await Selection.findOne({ giverUserId: req.user.id });

    if (!selection) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    // Decrypt receiver name and get receiver details
    const receiverUsername = selection.getDecryptedReceiverName();
    const receiver = await User.findOne({ username: receiverUsername }, 'username email');

    res.status(200).json({
      success: true,
      data: {
        _id: selection._id,
        giverUserId: selection.giverUserId,
        receiverUserId: receiver ? receiver._id : null,
        receiverUsername: receiver ? receiver.username : receiverUsername,
        receiverEmail: receiver ? receiver.email : null,
        timestamp: selection.timestamp
      }
    });
  } catch (error) {
    console.error('Get my selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
