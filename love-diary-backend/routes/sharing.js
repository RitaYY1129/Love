const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getPreferences, updatePreferences, getSharedState, putSharedState } = require('../controllers/sharingController');
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(authenticate);
router.get('/preferences', asyncHandler(getPreferences));
router.put('/preferences', asyncHandler(updatePreferences));
router.get('/state/:module', asyncHandler(getSharedState));
router.put('/state/:module', asyncHandler(putSharedState));

module.exports = router;
