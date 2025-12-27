const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAvailableParticipants,
  selectParticipant,
  getMySelection,
  autoAssignParticipant
} = require('../controllers/selectionController');

router.get('/available', protect, getAvailableParticipants);
router.post('/', protect, selectParticipant);
router.post('/auto-assign', protect, autoAssignParticipant);
router.get('/my-selection', protect, getMySelection);

module.exports = router;
