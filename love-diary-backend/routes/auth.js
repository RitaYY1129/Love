const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  sendCode,
  smsLogin,
  smsRegister,
  wechatLogin
} = require('../controllers/mobileAuthController');
const {
  register,
  login,
  getProfile,
  updateProfile,
  bindPartner,
  unbindPartner
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/sms/send', sendCode);
router.post('/sms/login', smsLogin);
router.post('/sms/register', smsRegister);
router.post('/wechat', wechatLogin);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/partner/bind', authenticate, bindPartner);
router.post('/partner/unbind', authenticate, unbindPartner);

module.exports = router;
