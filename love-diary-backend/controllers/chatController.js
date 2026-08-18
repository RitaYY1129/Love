const { query } = require('../config/db');

const allowedTypes = new Set(['text', 'image', 'voice', 'video', 'location']);

const requirePartner = (req, res) => {
  if (!req.user.partner_id) {
    res.status(400).json({ message: '请先绑定另一半' });
    return false;
  }
  return true;
};

const parseMetadata = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
};

const publicMessage = (row, userId) => ({
  id: Number(row.id),
  type: row.type,
  content: row.content,
  ...parseMetadata(row.metadata),
  senderId: Number(row.sender_id),
  receiverId: Number(row.receiver_id),
  isMine: Number(row.sender_id) === Number(userId),
  time: new Date(row.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  createdAt: row.created_at,
  readAt: row.read_at
});

const listMessages = async (req, res) => {
  if (!requirePartner(req, res)) return;
  const afterId = Math.max(0, Number(req.query.afterId || 0));
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));
  const rows = await query(
    `SELECT id, sender_id, receiver_id, type, content, metadata, created_at, read_at
     FROM chat_messages
     WHERE id > ? AND (
       (sender_id = ? AND receiver_id = ?) OR
       (sender_id = ? AND receiver_id = ?)
     )
     ORDER BY id ASC LIMIT ${limit}`,
    [afterId, req.user.id, req.user.partner_id, req.user.partner_id, req.user.id]
  );
  if (rows.length) {
    await query(
      `UPDATE chat_messages SET read_at = COALESCE(read_at, NOW())
       WHERE receiver_id = ? AND sender_id = ? AND id <= ?`,
      [req.user.id, req.user.partner_id, rows[rows.length - 1].id]
    );
  }
  return res.json({ messages: rows.map((row) => publicMessage(row, req.user.id)) });
};

const sendMessage = async (req, res) => {
  if (!requirePartner(req, res)) return;
  const type = String(req.body.type || 'text');
  const content = String(req.body.content || '');
  const metadata = req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {};
  if (!allowedTypes.has(type)) return res.status(400).json({ message: '不支持的消息类型' });
  if (!content.trim() && type !== 'location') return res.status(400).json({ message: '消息内容不能为空' });
  if (Buffer.byteLength(content, 'utf8') > 6 * 1024 * 1024) {
    return res.status(413).json({ message: '消息文件过大，请选择更小的文件' });
  }
  const result = await query(
    `INSERT INTO chat_messages (sender_id, receiver_id, type, content, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, req.user.partner_id, type, content, JSON.stringify(metadata)]
  );
  const rows = await query(
    `SELECT id, sender_id, receiver_id, type, content, metadata, created_at, read_at
     FROM chat_messages WHERE id = ?`,
    [result.insertId]
  );
  return res.status(201).json({ message: publicMessage(rows[0], req.user.id) });
};

module.exports = { listMessages, sendMessage };
