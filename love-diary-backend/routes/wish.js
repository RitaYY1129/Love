const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getWishes,
  createWish,
  updateWish,
  deleteWish,
  completeWish
} = require('../controllers/wishController');

router.get('/', authenticate, getWishes);
router.post('/', authenticate, createWish);
router.put('/:id', authenticate, updateWish);
router.delete('/:id', authenticate, deleteWish);
router.post('/:id/complete', authenticate, completeWish);

module.exports = router;