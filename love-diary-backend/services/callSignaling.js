const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const roomName = userId => `user:${userId}`;

const serializeCall = row => ({
  id: Number(row.id),
  callerId: Number(row.caller_id),
  receiverId: Number(row.receiver_id),
  callType: row.call_type,
  status: row.status,
  createdAt: row.started_at,
  answeredAt: row.answered_at || null,
  endedAt: row.ended_at || null,
  duration: Number(row.duration_seconds || 0)
});

const findCallForUser = async (callId, userId) => {
  const rows = await query(
    `SELECT id, caller_id, receiver_id, call_type, status, started_at,
            answered_at, ended_at, duration_seconds
     FROM call_records
     WHERE id = ? AND (caller_id = ? OR receiver_id = ?)`,
    [callId, userId, userId]
  );
  return rows[0] || null;
};

const setupCallSignaling = io => {
  io.use(async (socket, next) => {
    try {
      const token = String(socket.handshake.auth?.token || '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const users = await query(
        'SELECT id, nickname, avatar, partner_id FROM users WHERE id = ?',
        [decoded.userId]
      );
      if (!users[0]) return next(new Error('用户不存在'));
      socket.user = users[0];
      return next();
    } catch {
      return next(new Error('登录状态无效'));
    }
  });

  io.on('connection', socket => {
    socket.join(roomName(socket.user.id));

    socket.on('call:invite', async (payload = {}, acknowledge = () => {}) => {
      try {
        const users = await query(
          'SELECT id, nickname, avatar, partner_id FROM users WHERE id = ?',
          [socket.user.id]
        );
        const user = users[0];
        if (!user?.partner_id) return acknowledge({ ok: false, message: '请先绑定另一半' });
        const callType = payload.callType === 'video' ? 'video' : 'voice';
        const active = await query(
          `SELECT id FROM call_records
           WHERE status IN ('ringing','active')
             AND (caller_id IN (?, ?) OR receiver_id IN (?, ?))
           LIMIT 1`,
          [user.id, user.partner_id, user.id, user.partner_id]
        );
        if (active[0]) return acknowledge({ ok: false, message: '当前已有通话正在进行' });
        const result = await query(
          `INSERT INTO call_records (caller_id, receiver_id, call_type, status)
           VALUES (?, ?, ?, 'ringing')`,
          [user.id, user.partner_id, callType]
        );
        const rows = await query('SELECT * FROM call_records WHERE id = ?', [result.insertId]);
        const call = serializeCall(rows[0]);
        const targetRoom = roomName(user.partner_id);
        const partnerOnline = Boolean(io.sockets.adapter.rooms.get(targetRoom)?.size);
        io.to(targetRoom).emit('call:incoming', {
          call,
          caller: { id: user.id, nickname: user.nickname, avatar: user.avatar || '' }
        });
        acknowledge({ ok: true, call, partnerOnline });
      } catch (error) {
        acknowledge({ ok: false, message: error.message || '发起通话失败' });
      }
    });

    socket.on('call:accept', async ({ callId } = {}, acknowledge = () => {}) => {
      try {
        const call = await findCallForUser(callId, socket.user.id);
        if (!call || Number(call.receiver_id) !== Number(socket.user.id) || call.status !== 'ringing') {
          return acknowledge({ ok: false, message: '来电已结束或不存在' });
        }
        await query(
          `UPDATE call_records SET status = 'active', answered_at = NOW()
           WHERE id = ? AND status = 'ringing'`,
          [callId]
        );
        const updated = await findCallForUser(callId, socket.user.id);
        io.to(roomName(call.caller_id)).emit('call:accepted', { call: serializeCall(updated) });
        acknowledge({ ok: true, call: serializeCall(updated) });
      } catch (error) {
        acknowledge({ ok: false, message: error.message || '接听失败' });
      }
    });

    socket.on('call:signal', async ({ callId, signal } = {}) => {
      const call = await findCallForUser(callId, socket.user.id);
      if (!call || !['ringing', 'active'].includes(call.status)) return;
      const targetId = Number(call.caller_id) === Number(socket.user.id)
        ? call.receiver_id
        : call.caller_id;
      io.to(roomName(targetId)).emit('call:signal', {
        callId: Number(callId),
        signal,
        fromUserId: Number(socket.user.id)
      });
    });

    const finishCall = async (eventName, payload = {}, acknowledge = () => {}) => {
      try {
        const call = await findCallForUser(payload.callId, socket.user.id);
        if (!call || !['ringing', 'active'].includes(call.status)) {
          return acknowledge({ ok: false, message: '通话已经结束' });
        }
        const status = eventName === 'call:reject' ? 'rejected' : 'ended';
        await query(
          `UPDATE call_records
           SET status = ?, ended_at = NOW(),
               duration_seconds = CASE
                 WHEN answered_at IS NULL THEN 0
                 ELSE GREATEST(0, TIMESTAMPDIFF(SECOND, answered_at, NOW()))
               END
           WHERE id = ?`,
          [status, call.id]
        );
        const updated = await findCallForUser(call.id, socket.user.id);
        const targetId = Number(call.caller_id) === Number(socket.user.id)
          ? call.receiver_id
          : call.caller_id;
        io.to(roomName(targetId)).emit('call:ended', { call: serializeCall(updated), reason: status });
        acknowledge({ ok: true, call: serializeCall(updated) });
      } catch (error) {
        acknowledge({ ok: false, message: error.message || '结束通话失败' });
      }
    };

    socket.on('call:reject', (payload, acknowledge) => finishCall('call:reject', payload, acknowledge));
    socket.on('call:end', (payload, acknowledge) => finishCall('call:end', payload, acknowledge));
  });
};

module.exports = { setupCallSignaling };
