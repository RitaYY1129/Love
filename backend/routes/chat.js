const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { listMessages, sendMessage } = require('../controllers/chatController');
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(authenticate);
router.get('/', asyncHandler(listMessages));
router.post('/', asyncHandler(sendMessage));

module.exports = router;
