const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getPhotos,
  uploadPhoto,
  updatePhoto,
  deletePhoto
} = require('../controllers/photoController');

router.get('/', authenticate, getPhotos);
router.post('/', authenticate, uploadPhoto);
router.put('/:id', authenticate, updatePhoto);
router.delete('/:id', authenticate, deletePhoto);

module.exports = router;