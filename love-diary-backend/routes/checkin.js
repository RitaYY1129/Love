const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  checkin,
  getHistory,
  getStats
} = require('../controllers/checkinController');

router.post('/', authenticate, checkin);
router.get('/history', authenticate, getHistory);
router.get('/stats', authenticate, getStats);

module.exports = router;