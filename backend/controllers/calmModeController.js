const { query } = require('../config/db');

const getStatus = async (req, res) => {
  const rows = await query(
    `SELECT id, requested_by, partner_id, accepted_by, status, ends_at, created_at
     FROM couple_calm_modes
     WHERE (requested_by = ? AND partner_id = ?) OR (requested_by = ? AND partner_id = ?)
     ORDER BY id DESC LIMIT 1`,
    [req.user.id, req.user.partner_id || 0, req.user.partner_id || 0, req.user.id]
  );
  return res.json({ calmMode: rows[0] || null });
};

const requestMode = async (req, res) => {
  if (!req.user.partner_id) return res.status(400).json({ message: '请先绑定另一半' });
  const durationHours = Math.min(72, Math.max(1, Number(req.body.durationHours || 2)));
  await query(
    `UPDATE couple_calm_modes SET status = 'ended', ended_at = NOW()
     WHERE status IN ('pending', 'active') AND (requested_by IN (?, ?) OR partner_id IN (?, ?))`,
    [req.user.id, req.user.partner_id, req.user.id, req.user.partner_id]
  );
  const result = await query(
    `INSERT INTO couple_calm_modes (requested_by, partner_id, status, ends_at)
     VALUES (?, ?, 'pending', DATE_ADD(NOW(), INTERVAL ? HOUR))`,
    [req.user.id, req.user.partner_id, durationHours]
  );
  return res.status(201).json({ message: '已向另一半发出冷静模式邀请', id: result.insertId });
};

const acceptMode = async (req, res) => {
  const result = await query(
    `UPDATE couple_calm_modes SET accepted_by = ?, status = 'active', accepted_at = NOW()
     WHERE id = ? AND partner_id = ? AND status = 'pending'`,
    [req.user.id, req.params.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: '邀请不存在或已失效' });
  return res.json({ message: '情侣冷静模式已由双方确认' });
};

const exitMode = async (req, res) => {
  const result = await query(
    `UPDATE couple_calm_modes SET status = 'ended', ended_at = NOW()
     WHERE id = ? AND status IN ('pending', 'active') AND (requested_by = ? OR partner_id = ?)`,
    [req.params.id, req.user.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: '冷静模式不存在或已结束' });
  return res.json({ message: '冷静模式已退出' });
};

module.exports = { getStatus, requestMode, acceptMode, exitMode };
