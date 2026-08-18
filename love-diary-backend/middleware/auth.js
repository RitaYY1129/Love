const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权，请登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await query('SELECT id, phone, nickname, avatar, invite_code, partner_id FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user || user.length === 0) {
      return res.status(401).json({ message: '用户不存在' });
    }

    req.user = user[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token无效或已过期' });
  }
};

module.exports = { authenticate };
