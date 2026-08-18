const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getStatus, requestMode, acceptMode, exitMode } = require('../controllers/calmModeController');
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(authenticate);
router.get('/', asyncHandler(getStatus));
router.post('/request', asyncHandler(requestMode));
router.post('/:id/accept', asyncHandler(acceptMode));
router.post('/:id/exit', asyncHandler(exitMode));

module.exports = router;
