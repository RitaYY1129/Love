const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../config/db');
const crypto = require('crypto');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const parseProfileData = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const serializeUser = (user) => ({
  ...user,
  avatar: user.avatar || '',
  profile_data: parseProfileData(user.profile_data)
});

const register = async (req, res) => {
  try {
    const { phone, nickname, password } = req.body;

    if (!phone || !nickname || !password) {
      return res.status(400).json({ message: '请填写完整信息' });
    }

    const existingUser = await query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: '该手机号已被注册' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inviteCode = `LOVE${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const result = await query(
      'INSERT INTO users (phone, nickname, password_hash, invite_code) VALUES (?, ?, ?, ?)',
      [phone, nickname, passwordHash, inviteCode]
    );

    const token = generateToken(result.insertId);
    return res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: result.insertId,
        phone,
        nickname,
        invite_code: inviteCode
      }
    });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: '请填写完整信息' });
    }

    const user = await query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user || user.length === 0) {
      return res.status(401).json({ message: '手机号或密码错误' });
    }

    if (!user[0].password_hash) {
      return res.status(401).json({ message: '该账号未设置密码，请使用验证码或微信登录' });
    }

    const validPassword = await bcrypt.compare(password, user[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: '手机号或密码错误' });
    }

    const token = generateToken(user[0].id);
    return res.json({
      message: '登录成功',
      token,
      user: {
        id: user[0].id,
        phone: user[0].phone,
        nickname: user[0].nickname,
        avatar: user[0].avatar,
        profile_data: parseProfileData(user[0].profile_data),
        partner_id: user[0].partner_id,
        invite_code: user[0].invite_code
      }
    });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await query('SELECT id, phone, nickname, avatar, profile_data, invite_code, partner_id, created_at FROM users WHERE id = ?', [req.user.id]);
    
    if (!user || user.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    let partner = null;
    if (user[0].partner_id) {
      const partners = await query('SELECT id, nickname, avatar, profile_data FROM users WHERE id = ?', [user[0].partner_id]);
      partner = partners[0] ? serializeUser(partners[0]) : null;
    }
    return res.json({ user: { ...serializeUser(user[0]), partner } });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, profile_data: profileData } = req.body;
    const updates = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(req.body, 'nickname')) {
      if (typeof nickname !== 'string' || !nickname.trim() || nickname.trim().length > 50) {
        return res.status(400).json({ message: '昵称需要为 1-50 个字符' });
      }
      updates.push('nickname = ?');
      params.push(nickname.trim());
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'avatar')) {
      if (typeof avatar !== 'string' || avatar.length > 500000) {
        return res.status(400).json({ message: '头像格式不正确或图片过大' });
      }
      updates.push('avatar = ?');
      params.push(avatar);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'profile_data')) {
      if (!profileData || typeof profileData !== 'object' || Array.isArray(profileData)) {
        return res.status(400).json({ message: '个人资料格式不正确' });
      }
      const allowedProfile = {
        gender: String(profileData.gender || '').slice(0, 20),
        birthday: String(profileData.birthday || '').slice(0, 10),
        signature: String(profileData.signature || '').trim().slice(0, 120),
        city: String(profileData.city || '').trim().slice(0, 50),
        sleepTime: String(profileData.sleepTime || '').slice(0, 5),
        wakeTime: String(profileData.wakeTime || '').slice(0, 5),
        communicationStyle: String(profileData.communicationStyle || '').slice(0, 30),
        conflictStyle: String(profileData.conflictStyle || '').slice(0, 30),
        datePreference: String(profileData.datePreference || '').slice(0, 30),
        loveLanguages: Array.isArray(profileData.loveLanguages)
          ? profileData.loveLanguages.map(item => String(item).slice(0, 20)).slice(0, 5)
          : [],
        hobbies: Array.isArray(profileData.hobbies)
          ? profileData.hobbies.map(item => String(item).trim().slice(0, 20)).filter(Boolean).slice(0, 12)
          : [],
        favoriteFood: String(profileData.favoriteFood || '').trim().slice(0, 100),
        dislikes: String(profileData.dislikes || '').trim().slice(0, 100)
      };
      updates.push('profile_data = ?');
      params.push(JSON.stringify(allowedProfile));
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有更新内容' });
    }

    params.push(req.user.id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const user = await query(
      'SELECT id, phone, nickname, avatar, profile_data, invite_code, partner_id, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return res.json({ message: '个人资料已保存', user: serializeUser(user[0]) });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const bindPartner = async (req, res) => {
  try {
    const { partnerCode } = req.body;

    if (!partnerCode) {
      return res.status(400).json({ message: '请输入绑定码' });
    }

    const partner = await query('SELECT id, phone, nickname, avatar, partner_id FROM users WHERE invite_code = ? OR phone = ?', [partnerCode.toUpperCase(), partnerCode]);
    if (!partner || partner.length === 0) {
      return res.status(404).json({ message: '绑定码无效' });
    }

    const partnerId = partner[0].id;
    
    if (req.user.id === partnerId) {
      return res.status(400).json({ message: '不能绑定自己' });
    }

    await transaction(async (conn) => {
      const [lockedUsers] = await conn.execute(
        'SELECT id, partner_id FROM users WHERE id IN (?, ?) FOR UPDATE',
        [req.user.id, partnerId]
      );
      const current = lockedUsers.find((item) => Number(item.id) === Number(req.user.id));
      const target = lockedUsers.find((item) => Number(item.id) === Number(partnerId));
      if (current?.partner_id && Number(current.partner_id) !== Number(partnerId)) {
        throw Object.assign(new Error('你已绑定另一半，请先解除当前关系'), { statusCode: 409 });
      }
      if (target?.partner_id && Number(target.partner_id) !== Number(req.user.id)) {
        throw Object.assign(new Error('对方已经绑定了另一半'), { statusCode: 409 });
      }
      await conn.execute('UPDATE users SET partner_id = ? WHERE id = ?', [partnerId, req.user.id]);
      await conn.execute('UPDATE users SET partner_id = ? WHERE id = ?', [req.user.id, partnerId]);
    });

    return res.json({ message: '绑定成功', partner: partner[0] });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || '服务器错误' });
  }
};

const unbindPartner = async (req, res) => {
  try {
    const { partner_id } = req.user;
    
    if (!partner_id) {
      return res.status(400).json({ message: '您还没有绑定伴侣' });
    }

    await transaction(async (conn) => {
      await conn.execute('UPDATE users SET partner_id = NULL WHERE id = ?', [req.user.id]);
      await conn.execute('UPDATE users SET partner_id = NULL WHERE id = ?', [partner_id]);
    });

    return res.json({ message: '解绑成功' });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  bindPartner,
  unbindPartner
};
