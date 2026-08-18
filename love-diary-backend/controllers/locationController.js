const { query } = require('../config/db');

const getLocation = async (req, res) => {
  try {
    const location = await query(
      'SELECT id, latitude, longitude, address, shared, created_at FROM locations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    return res.json(location.length > 0 ? location[0] : null);
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, shared } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: '请提供坐标信息' });
    }

    const existing = await query(
      'SELECT id FROM locations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (existing.length > 0) {
      await query(
        'UPDATE locations SET latitude = ?, longitude = ?, address = ?, shared = ?, created_at = NOW() WHERE id = ?',
        [latitude, longitude, address || '', shared || false, existing[0].id]
      );
      
      const location = await query('SELECT * FROM locations WHERE id = ?', [existing[0].id]);
      return res.json({ message: '更新成功', location: location[0] });
    }

    const result = await query(
      'INSERT INTO locations (user_id, latitude, longitude, address, shared) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, latitude, longitude, address || '', shared || false]
    );

    const location = await query('SELECT * FROM locations WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: '保存成功', location: location[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const getPartnerLocation = async (req, res) => {
  try {
    if (!req.user.partner_id) {
      return res.status(400).json({ message: '您还没有绑定伴侣' });
    }
    await query('INSERT IGNORE INTO sharing_preferences (user_id) VALUES (?), (?)', [req.user.id, req.user.partner_id]);
    const permissions = await query(
      'SELECT user_id, share_location FROM sharing_preferences WHERE user_id IN (?, ?)',
      [req.user.id, req.user.partner_id]
    );
    if (permissions.length !== 2 || permissions.some((item) => !item.share_location)) {
      return res.status(403).json({ message: '双方都开启位置共享后才能查看' });
    }

    const location = await query(
      'SELECT l.latitude, l.longitude, l.address, l.shared, l.created_at, u.nickname, u.avatar ' +
      'FROM locations l JOIN users u ON l.user_id = u.id ' +
      'WHERE l.user_id = ? AND l.shared = TRUE ORDER BY l.created_at DESC LIMIT 1',
      [req.user.partner_id]
    );

    if (location.length === 0) {
      return res.json(null);
    }

    return res.json({
      latitude: location[0].latitude,
      longitude: location[0].longitude,
      address: location[0].address,
      shared: location[0].shared,
      createdAt: location[0].created_at,
      partner: {
        nickname: location[0].nickname,
        avatar: location[0].avatar
      }
    });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const getLocationHistory = async (req, res) => {
  try {
    const history = await query(
      'SELECT id, latitude, longitude, address, shared, created_at FROM locations WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json(history);
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

module.exports = {
  getLocation,
  updateLocation,
  getPartnerLocation,
  getLocationHistory
};
