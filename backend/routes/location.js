const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getLocation,
  updateLocation,
  getPartnerLocation,
  getLocationHistory
} = require('../controllers/locationController');

router.get('/', authenticate, getLocation);
router.post('/', authenticate, updateLocation);
router.get('/partner', authenticate, getPartnerLocation);
router.get('/history', authenticate, getLocationHistory);

module.exports = router;