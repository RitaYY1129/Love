const { query } = require('../config/db');

const modules = ['anniversary', 'wishes', 'plans', 'fund', 'photos', 'diary', 'mood', 'checkin', 'location', 'device_activity'];
const defaults = {
  anniversary: true,
  wishes: true,
  plans: true,
  fund: true,
  photos: true,
  diary: false,
  mood: false,
  checkin: true,
  location: false,
  device_activity: false
};

const ensurePreferences = async (userId) => {
  await query('INSERT IGNORE INTO sharing_preferences (user_id) VALUES (?)', [userId]);
};

const rowToPreferences = (row = {}) => Object.fromEntries(
  modules.map((key) => [key, row[`share_${key}`] === undefined ? defaults[key] : Boolean(row[`share_${key}`])])
);

const getPreferences = async (req, res) => {
  await ensurePreferences(req.user.id);
  const mineRows = await query('SELECT * FROM sharing_preferences WHERE user_id = ?', [req.user.id]);
  let partner = null;
  if (req.user.partner_id) {
    await ensurePreferences(req.user.partner_id);
    const partnerRows = await query('SELECT * FROM sharing_preferences WHERE user_id = ?', [req.user.partner_id]);
    partner = rowToPreferences(partnerRows[0]);
  }
  const mine = rowToPreferences(mineRows[0]);
  const effective = Object.fromEntries(modules.map((key) => [key, Boolean(req.user.partner_id && mine[key] && partner?.[key])]));
  return res.json({ preferences: mine, partnerPreferences: partner, effective });
};

const updatePreferences = async (req, res) => {
  await ensurePreferences(req.user.id);
  const entries = modules.filter((key) => typeof req.body[key] === 'boolean');
  if (!entries.length) return res.status(400).json({ message: '没有可更新的共享设置' });
  const assignments = entries.map((key) => `share_${key} = ?`).join(', ');
  await query(
    `UPDATE sharing_preferences SET ${assignments} WHERE user_id = ?`,
    [...entries.map((key) => req.body[key]), req.user.id]
  );
  return getPreferences(req, res);
};

const coupleIds = (req) => [Math.min(req.user.id, req.user.partner_id), Math.max(req.user.id, req.user.partner_id)];

const ensureShared = async (req, res, moduleKey) => {
  if (!req.user.partner_id) {
    res.status(400).json({ message: '请先绑定另一半' });
    return false;
  }
  if (!modules.includes(moduleKey)) {
    res.status(404).json({ message: '不支持的共享内容' });
    return false;
  }
  await ensurePreferences(req.user.id);
  await ensurePreferences(req.user.partner_id);
  const rows = await query(
    `SELECT user_id, share_${moduleKey} AS enabled FROM sharing_preferences WHERE user_id IN (?, ?)`,
    [req.user.id, req.user.partner_id]
  );
  if (rows.length !== 2 || rows.some((row) => !row.enabled)) {
    res.status(403).json({ message: '需要双方都开启该内容的共享权限' });
    return false;
  }
  return true;
};

const getSharedState = async (req, res) => {
  const moduleKey = String(req.params.module || '');
  if (!await ensureShared(req, res, moduleKey)) return;
  const [lowId, highId] = coupleIds(req);
  const rows = await query(
    `SELECT payload, version, updated_by, updated_at FROM couple_shared_state
     WHERE user_low_id = ? AND user_high_id = ? AND module_key = ?`,
    [lowId, highId, moduleKey]
  );
  if (!rows[0]) return res.json({ payload: null, version: 0 });
  let payload = null;
  try { payload = JSON.parse(rows[0].payload); } catch {}
  return res.json({ ...rows[0], payload });
};

const putSharedState = async (req, res) => {
  const moduleKey = String(req.params.module || '');
  if (!await ensureShared(req, res, moduleKey)) return;
  const payload = JSON.stringify(req.body.payload ?? null);
  if (Buffer.byteLength(payload, 'utf8') > 7 * 1024 * 1024) {
    return res.status(413).json({ message: '共享内容过大，请减少照片数量' });
  }
  const [lowId, highId] = coupleIds(req);
  await query(
    `INSERT INTO couple_shared_state
       (user_low_id, user_high_id, module_key, payload, updated_by, version)
     VALUES (?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       payload = VALUES(payload), updated_by = VALUES(updated_by),
       version = version + 1, updated_at = CURRENT_TIMESTAMP`,
    [lowId, highId, moduleKey, payload, req.user.id]
  );
  return getSharedState(req, res);
};

module.exports = { getPreferences, updatePreferences, getSharedState, putSharedState };
