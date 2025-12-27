const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAvailableParticipants,
  selectParticipant,
  getMySelection
} = require('../controllers/selectionController');

router.get('/available', protect, getAvailableParticipants);
router.post('/', protect, selectParticipant);
router.get('/my-selection', protect, getMySelection);

module.exports = router;
