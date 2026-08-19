// 视频/语音通话实时信令服务
// 与前端 App 统一走 Supabase 体系（profiles / call_records 表）。
// 账号体系为自建 profiles + bcrypt，前端通过 auth.userId / auth.coupleId 声明身份，
// 信令服务据此建立房间、查找情侣、写入通话记录。
const { createClient } = require('@supabase/supabase-js')

const roomName = userId => `user:${userId}`

let supabase = null
function getSupabase() {
  if (supabase) return supabase
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('未配置 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY，无法启用实时通话')
  }
  supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
  return supabase
}

const getProfile = async (userId) => {
  if (!userId) return null
  const client = getSupabase()
  const { data } = await client
    .from('profiles')
    .select('id, nickname, avatar, couple_id')
    .eq('id', userId)
    .maybeSingle()
  return data || null
}

const getPartner = async (coupleId, myId) => {
  if (!coupleId) return null
  const client = getSupabase()
  const { data } = await client
    .from('profiles')
    .select('id, nickname, avatar, couple_id')
    .eq('couple_id', coupleId)
    .neq('id', myId)
    .maybeSingle()
  return data || null
}

const setupCallSignaling = io => {
  io.use((socket, next) => {
    // 身份由前端在 auth 中提供（userId / coupleId），信令仅据此转发
    const userId = String(socket.handshake.auth?.userId || '').trim()
    if (!userId) return next(new Error('缺少用户标识'))
    socket.user = { id: userId, coupleId: String(socket.handshake.auth?.coupleId || '').trim() || null }
    return next()
  })

  io.on('connection', socket => {
    socket.join(roomName(socket.user.id))

    socket.on('call:invite', async (payload = {}, acknowledge = () => {}) => {
      try {
        const user = socket.user
        let coupleId = user.coupleId
        if (!coupleId) {
          const me = await getProfile(user.id)
          coupleId = me?.couple_id || null
        }
        if (!coupleId) return acknowledge({ ok: false, message: '请先绑定另一半' })
        const partner = await getPartner(coupleId, user.id)
        if (!partner) return acknowledge({ ok: false, message: '未找到另一半' })
        const callType = payload.callType === 'video' ? 'video' : 'voice'

        const client = getSupabase()
        const { data: existing } = await client
          .from('call_records')
          .select('id')
          .eq('couple_id', coupleId)
          .in('status', ['ringing', 'active'])
          .limit(1)
        if (existing && existing.length) return acknowledge({ ok: false, message: '当前已有通话正在进行' })

        const { data: inserted, error } = await client
          .from('call_records')
          .insert({ couple_id: coupleId, caller_id: user.id, callee_id: partner.id, call_type: callType, status: 'ringing' })
          .select()
          .single()
        if (error) throw new Error(error.message || '发起通话失败')

        const call = {
          id: inserted.id,
          callerId: inserted.caller_id,
          calleeId: inserted.callee_id,
          callType: inserted.call_type,
          status: inserted.status
        }
        const targetRoom = roomName(partner.id)
        const partnerOnline = Boolean(io.sockets.adapter.rooms.get(targetRoom)?.size)
        io.to(targetRoom).emit('call:incoming', {
          call,
          caller: { id: user.id, nickname: partner ? '' : '', avatar: '' }
        })
        // 带上我方昵称，让对方来电界面显示“谁打来的”
        const me = await getProfile(user.id)
        io.to(targetRoom).emit('call:incoming', {
          call,
          caller: { id: user.id, nickname: me?.nickname || '另一半', avatar: me?.avatar || '' }
        })
        acknowledge({ ok: true, call, partnerOnline })
      } catch (error) {
        acknowledge({ ok: false, message: error.message || '发起通话失败' })
      }
    })

    socket.on('call:accept', async ({ callId } = {}, acknowledge = () => {}) => {
      try {
        const client = getSupabase()
        const { data: call } = await client.from('call_records').select('*').eq('id', callId).single()
        if (!call || Number(call.callee_id) !== Number(socket.user.id) || call.status !== 'ringing') {
          return acknowledge({ ok: false, message: '来电已结束或不存在' })
        }
        const { data: updated, error } = await client
          .from('call_records')
          .update({ status: 'active', answered_at: new Date().toISOString() })
          .eq('id', callId)
          .select()
          .single()
        if (error) throw new Error(error.message || '接听失败')
        const callOut = { id: updated.id, callerId: updated.caller_id, calleeId: updated.callee_id, callType: updated.call_type, status: updated.status }
        io.to(roomName(call.caller_id)).emit('call:accepted', { call: callOut })
        acknowledge({ ok: true, call: callOut })
      } catch (error) {
        acknowledge({ ok: false, message: error.message || '接听失败' })
      }
    })

    socket.on('call:signal', async ({ callId, signal } = {}) => {
      try {
        const client = getSupabase()
        const { data: call } = await client.from('call_records').select('*').eq('id', callId).single()
        if (!call || !['ringing', 'active'].includes(call.status)) return
        const targetId = Number(call.caller_id) === Number(socket.user.id) ? call.callee_id : call.caller_id
        io.to(roomName(targetId)).emit('call:signal', {
          callId: Number(callId),
          signal,
          fromUserId: Number(socket.user.id)
        })
      } catch {}
    })

    const finishCall = async (eventName, payload = {}, acknowledge = () => {}) => {
      try {
        const client = getSupabase()
        const { data: call } = await client.from('call_records').select('*').eq('id', payload.callId).single()
        if (!call || !['ringing', 'active'].includes(call.status)) {
          return acknowledge({ ok: false, message: '通话已经结束' })
        }
        const status = eventName === 'call:reject' ? 'rejected' : 'ended'
        const duration = call.answered_at
          ? Math.max(0, Math.floor((Date.now() - new Date(call.answered_at).getTime()) / 1000))
          : 0
        const { error } = await client
          .from('call_records')
          .update({ status, ended_at: new Date().toISOString(), duration_seconds: duration })
          .eq('id', call.id)
        if (error) throw new Error(error.message || '结束通话失败')
        const callOut = { id: call.id, callerId: call.caller_id, calleeId: call.callee_id, callType: call.call_type, status }
        const targetId = Number(call.caller_id) === Number(socket.user.id) ? call.callee_id : call.caller_id
        io.to(roomName(targetId)).emit('call:ended', { call: callOut, reason: status })
        acknowledge({ ok: true, call: callOut })
      } catch (error) {
        acknowledge({ ok: false, message: error.message || '结束通话失败' })
      }
    }

    socket.on('call:reject', (payload, acknowledge) => finishCall('call:reject', payload, acknowledge))
    socket.on('call:end', (payload, acknowledge) => finishCall('call:end', payload, acknowledge))
  })
}

module.exports = { setupCallSignaling }
