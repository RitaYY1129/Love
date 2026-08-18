const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMoods,
  createMood,
  getMoodStats
} = require('../controllers/moodController');

router.get('/', authenticate, getMoods);
router.post('/', authenticate, createMood);
router.get('/stats', authenticate, getMoodStats);

module.exports = router;