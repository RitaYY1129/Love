const { query } = require('../config/db');

const listCalls = async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const rows = await query(
    `SELECT c.id, c.caller_id, c.receiver_id, c.call_type, c.status,
            c.started_at, c.answered_at, c.ended_at, c.duration_seconds,
            caller.nickname AS caller_name, receiver.nickname AS receiver_name
     FROM call_records c
     JOIN users caller ON caller.id = c.caller_id
     JOIN users receiver ON receiver.id = c.receiver_id
     WHERE c.caller_id = ? OR c.receiver_id = ?
     ORDER BY c.id DESC LIMIT ${limit}`,
    [req.user.id, req.user.id]
  );
  const calls = rows.map(row => ({
    id: Number(row.id),
    type: 'call',
    callType: row.call_type,
    status: row.status,
    callerId: Number(row.caller_id),
    receiverId: Number(row.receiver_id),
    isMine: Number(row.caller_id) === Number(req.user.id),
    partnerName: Number(row.caller_id) === Number(req.user.id) ? row.receiver_name : row.caller_name,
    duration: Number(row.duration_seconds || 0),
    createdAt: row.started_at,
    answeredAt: row.answered_at,
    endedAt: row.ended_at
  }));
  return res.json({ calls });
};

module.exports = { listCalls };
