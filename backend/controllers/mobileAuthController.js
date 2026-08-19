const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/db');
const { sendSmsCode } = require('../services/smsService');
const { exchangeCodeForUser } = require('../services/wechatService');
const jwt = require('jsonwebtoken');

const isValidPhone = (phone) => /^1[3-9]\d{9}$/.test(String(phone || ''));
const SMS_PURPOSES = new Set(['login', 'register']);
const createInviteCode = () => `LOVE${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('服务器未配置 JWT_SECRET');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

const codeHash = (phone, purpose, code) => {
  const secret = process.env.SMS_CODE_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('服务器未配置 SMS_CODE_SECRET');
  return crypto
    .createHmac('sha256', secret)
    .update(`${phone}:${purpose}:${code}`)
    .digest('hex');
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

const publicUser = (user) => ({
  id: user.id,
  phone: user.phone || null,
  nickname: user.nickname,
  avatar: user.avatar || '',
  profile_data: parseProfileData(user.profile_data),
  partner_id: user.partner_id || null,
  invite_code: user.invite_code
});

const sendCode = async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const purpose = SMS_PURPOSES.has(req.body.purpose) ? req.body.purpose : 'login';
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: '请输入正确的11位手机号' });
    }

    const recent = await query(
      `SELECT created_at FROM sms_verification_codes
       WHERE phone = ? AND purpose = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
       ORDER BY id DESC LIMIT 1`,
      [phone, purpose]
    );
    if (recent.length > 0) {
      return res.status(429).json({ message: '发送过于频繁，请稍后再试' });
    }

    const hourly = await query(
      `SELECT COUNT(*) AS count FROM sms_verification_codes
       WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [phone]
    );
    if (Number(hourly[0]?.count || 0) >= 5) {
      return res.status(429).json({ message: '当前手机号发送次数过多，请一小时后再试' });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const ttlSeconds = Math.max(60, Number(process.env.SMS_CODE_TTL_SECONDS || 300));
    const expiresInMinutes = Math.ceil(ttlSeconds / 60);
    const result = await sendSmsCode(phone, code, expiresInMinutes);

    await query(
      `INSERT INTO sms_verification_codes
       (phone, purpose, code_hash, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))`,
      [phone, purpose, codeHash(phone, purpose, code), ttlSeconds]
    );

    return res.json({
      message: '验证码已发送',
      expiresIn: ttlSeconds,
      ...(result.devCode ? { devCode: result.devCode } : {})
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || '验证码发送失败' });
  }
};

const consumeCode = async (conn, phone, purpose, code) => {
  const [records] = await conn.execute(
    `SELECT id, code_hash, attempt_count FROM sms_verification_codes
     WHERE phone = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1 FOR UPDATE`,
    [phone, purpose]
  );
  const record = records[0];
  if (!record || record.attempt_count >= 5) {
    throw Object.assign(new Error('验证码无效或已过期'), { statusCode: 400 });
  }

  const actual = Buffer.from(record.code_hash, 'hex');
  const expected = Buffer.from(codeHash(phone, purpose, code), 'hex');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    await conn.execute(
      'UPDATE sms_verification_codes SET attempt_count = attempt_count + 1 WHERE id = ?',
      [record.id]
    );
    throw Object.assign(new Error('验证码错误'), { statusCode: 400 });
  }

  await conn.execute(
    'UPDATE sms_verification_codes SET consumed_at = NOW() WHERE id = ?',
    [record.id]
  );
};

const smsLogin = async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const code = String(req.body.code || '').trim();
    if (!isValidPhone(phone) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: '手机号或验证码格式不正确' });
    }

    const user = await transaction(async (conn) => {
      await consumeCode(conn, phone, 'login', code);
      const [users] = await conn.execute('SELECT * FROM users WHERE phone = ?', [phone]);
      if (users[0]) return users[0];

      const nickname = `恋爱用户${phone.slice(-4)}`;
      const [created] = await conn.execute(
        'INSERT INTO users (phone, nickname, password_hash, invite_code) VALUES (?, ?, NULL, ?)',
        [phone, nickname, createInviteCode()]
      );
      const [newUsers] = await conn.execute('SELECT * FROM users WHERE id = ?', [created.insertId]);
      return newUsers[0];
    });

    return res.json({
      message: '登录成功',
      token: generateToken(user.id),
      user: publicUser(user)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || '登录失败' });
  }
};

const smsRegister = async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const code = String(req.body.code || '').trim();
    const nickname = String(req.body.nickname || '').trim();
    const password = String(req.body.password || '');
    if (!isValidPhone(phone) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: '手机号或验证码格式不正确' });
    }
    if (!nickname || nickname.length > 50 || password.length < 6) {
      return res.status(400).json({ message: '昵称不能为空，密码至少需要6位' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await transaction(async (conn) => {
      await consumeCode(conn, phone, 'register', code);
      const [users] = await conn.execute('SELECT id FROM users WHERE phone = ?', [phone]);
      if (users[0]) {
        throw Object.assign(new Error('该手机号已被注册'), { statusCode: 409 });
      }
      const [created] = await conn.execute(
        'INSERT INTO users (phone, nickname, password_hash, invite_code) VALUES (?, ?, ?, ?)',
        [phone, nickname, passwordHash, createInviteCode()]
      );
      const [newUsers] = await conn.execute('SELECT * FROM users WHERE id = ?', [created.insertId]);
      return newUsers[0];
    });

    return res.status(201).json({
      message: '注册成功',
      token: generateToken(user.id),
      user: publicUser(user)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || '注册失败' });
  }
};

const wechatLogin = async (req, res) => {
  try {
    const code = String(req.body.code || '').trim();
    if (!code) {
      return res.status(400).json({ message: '缺少微信授权码' });
    }

    const wechatUser = await exchangeCodeForUser(code);
    const user = await transaction(async (conn) => {
      const [identities] = await conn.execute(
        `SELECT u.* FROM auth_identities i
         JOIN users u ON u.id = i.user_id
         WHERE i.provider = 'wechat' AND i.provider_user_id = ?`,
        [wechatUser.openid]
      );
      if (identities[0]) {
        await conn.execute(
          'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
          [wechatUser.nickname, wechatUser.avatar, identities[0].id]
        );
        return { ...identities[0], nickname: wechatUser.nickname, avatar: wechatUser.avatar };
      }

      const [created] = await conn.execute(
        'INSERT INTO users (phone, nickname, avatar, password_hash, invite_code) VALUES (NULL, ?, ?, NULL, ?)',
        [wechatUser.nickname, wechatUser.avatar, createInviteCode()]
      );
      await conn.execute(
        `INSERT INTO auth_identities
         (user_id, provider, provider_user_id, union_id)
         VALUES (?, 'wechat', ?, ?)`,
        [created.insertId, wechatUser.openid, wechatUser.unionid]
      );
      const [newUsers] = await conn.execute('SELECT * FROM users WHERE id = ?', [created.insertId]);
      return newUsers[0];
    });

    return res.json({
      message: '微信登录成功',
      token: generateToken(user.id),
      user: publicUser(user)
    });
  } catch (error) {
    return res.status(502).json({ message: error.message || '微信登录失败' });
  }
};

module.exports = { sendCode, smsLogin, smsRegister, wechatLogin };
