const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createMessage,
  getPublicTasks,
  getSentMessages,
  getReceivedMessages
} = require('../controllers/messageController');

router.post('/', protect, createMessage);
router.get('/public', protect, getPublicTasks);
router.get('/sent', protect, getSentMessages);
router.get('/received', protect, getReceivedMessages);

module.exports = router;
