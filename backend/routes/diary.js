const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getDiaries,
  getDiary,
  createDiary,
  updateDiary,
  deleteDiary
} = require('../controllers/diaryController');

router.get('/', authenticate, getDiaries);
router.get('/:id', authenticate, getDiary);
router.post('/', authenticate, createDiary);
router.put('/:id', authenticate, updateDiary);
router.delete('/:id', authenticate, deleteDiary);

module.exports = router;