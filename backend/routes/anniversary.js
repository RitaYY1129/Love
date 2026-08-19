const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAnniversaries,
  createAnniversary,
  updateAnniversary,
  deleteAnniversary
} = require('../controllers/anniversaryController');

router.get('/', authenticate, getAnniversaries);
router.post('/', authenticate, createAnniversary);
router.put('/:id', authenticate, updateAnniversary);
router.delete('/:id', authenticate, deleteAnniversary);

module.exports = router;