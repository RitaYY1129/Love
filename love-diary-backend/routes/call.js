const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { listCalls } = require('../controllers/callController');
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(authenticate);
router.get('/', asyncHandler(listCalls));

module.exports = router;
