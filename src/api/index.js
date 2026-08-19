// ============================================================================
//  统一 API 层 —— 全部走 Supabase 云后端（无需本地服务器，手机/网页直接可用）
//  底层使用 src/api/supabase.js 的 fetch 封装；页面调用方式保持不变。
// ============================================================================
import { supabaseRest, supabaseAuth, supabaseFunctions } from './supabase'

function currentUserId() {
  const raw = localStorage.getItem('loveDiary_user')
  if (!raw) return null
  try { return JSON.parse(raw).id || null } catch { return null }
}
function token() { return localStorage.getItem('loveDiary_token') }
function withOwner(p) { return { ...p, owner_id: currentUserId() } }

// ---------------------------------------------------------------------------
//  AuthAPI —— 委托 supabase.js
// ---------------------------------------------------------------------------
export const AuthAPI = {
  login: (identifier, password) => supabaseAuth.signIn(identifier, password),
  register: (payload) => supabaseAuth.signUp(payload),
  loginByWechat: (code) => supabaseAuth.signInWithWechat(code),
  getProfile: () => supabaseAuth.getProfile(),
  updateProfile: (payload) => supabaseAuth.updateProfile(payload),
  bindPartner: (inviteCode) => supabaseAuth.bindPartner(inviteCode),
  unbindPartner: () => supabaseAuth.unbindPartner()
}

// ---------------------------------------------------------------------------
//  通用 REST 表操作（PostgREST 查询参数风格）
// ---------------------------------------------------------------------------
function restApi(table, { idField = 'id' } = {}) {
  return {
    list: async (query = {}) => {
      let path = `${table}?select=*`
      if (query.eq) for (const [k, v] of Object.entries(query.eq)) path += `&${k}=eq.${encodeURIComponent(v)}`
      if (query.order) path += `&order=${query.order}.${query.ascending ? 'asc' : 'desc'}`
      else path += '&order=created_at.desc'
      if (query.limit) path += `&limit=${query.limit}`
      const data = await supabaseRest.get(path, token())
      return { data: data || [] }
    },
    get: async (id) => {
      const data = await supabaseRest.get(`${table}?select=*&${idField}=eq.${id}`, token())
      return Array.isArray(data) ? data[0] : data
    },
    create: async (item) => {
      const data = await supabaseRest.post(`${table}?select=*`, withOwner(item), token())
      return Array.isArray(data) ? data[0] : data
    },
    update: async (id, item) => {
      const data = await supabaseRest.patch(`${table}?${idField}=eq.${id}&select=*`, item, token())
      return Array.isArray(data) ? data[0] : data
    },
    delete: async (id) => {
      await supabaseRest.delete(`${table}?${idField}=eq.${id}`, token())
      return { success: true }
    }
  }
}

export const DiaryAPI = restApi('diaries')
export const WishAPI = {
  ...restApi('wishes'),
  complete: async (id) => {
    const data = await supabaseRest.patch(`wishes?id=eq.${id}&select=*`, { completed: true, completed_at: new Date().toISOString() }, token())
    return Array.isArray(data) ? data[0] : data
  }
}
export const PlanAPI = {
  ...restApi('plans'),
  complete: async (id) => {
    const data = await supabaseRest.patch(`plans?id=eq.${id}&select=*`, { completed: true, completed_at: new Date().toISOString() }, token())
    return Array.isArray(data) ? data[0] : data
  }
}

function mapAnniversaryOut(item) {
  return {
    name: item.name,
    date: item.date,
    type: item.type,
    custom_type: item.customType,
    count_mode: item.countMode,
    repeat_yearly: item.repeatYearly,
    pin_to_home: item.pinToHome
  }
}

function mapAnniversaryIn(row) {
  if (!row) return row
  return {
    ...row,
    customType: row.custom_type,
    countMode: row.count_mode,
    repeatYearly: row.repeat_yearly,
    pinToHome: row.pin_to_home
  }
}

// 合并情侣共享数据(couple_id)与个人老数据(owner_id)并去重，保证双方看到一致
async function listAnniversariesMerged(query) {
  const cid = await getMyCoupleId()
  const uid = currentUserId()
  const results = []
  if (cid) {
    // 情侣绑定后：取这一对共享的所有纪念日
    const byCouple = await restApi('anniversaries').list({ ...query, eq: { ...(query.eq || {}), couple_id: cid } })
    results.push(...(byCouple.data || []))
    // 兼容老数据：couple_id 为空但仍是我创建的（对方也能看到，避免“有时好有时坏”）
    const byOwner = await restApi('anniversaries').list({ ...query, eq: { ...(query.eq || {}), owner_id: uid, couple_id: 'is.null' } })
    results.push(...(byOwner.data || []))
  } else {
    const byOwner = await restApi('anniversaries').list({ ...query, eq: { ...(query.eq || {}), owner_id: uid } })
    results.push(...(byOwner.data || []))
  }
  // 去重（同一 id 只保留一份）
  const seen = new Set()
  const deduped = []
  for (const r of results) {
    if (r.id && seen.has(r.id)) continue
    if (r.id) seen.add(r.id)
    deduped.push(r)
  }
  return deduped
}

export const AnniversaryAPI = {
  list: async (query = {}) => {
    const data = await listAnniversariesMerged(query)
    return { data: data.map(mapAnniversaryIn) }
  },
  get: async (id) => {
    const data = await supabaseRest.get(`anniversaries?select=*&id=eq.${id}`, token())
    return mapAnniversaryIn(Array.isArray(data) ? data[0] : data)
  },
  create: async (item) => {
    const cid = await getMyCoupleId()
    const data = await supabaseRest.post('anniversaries?select=*', { ...withOwner(mapAnniversaryOut(item)), couple_id: cid }, token())
    return mapAnniversaryIn(Array.isArray(data) ? data[0] : data)
  },
  update: async (id, item) => {
    const cid = await getMyCoupleId()
    const data = await supabaseRest.patch(`anniversaries?id=eq.${id}&select=*`, { ...mapAnniversaryOut(item), couple_id: cid }, token())
    return mapAnniversaryIn(Array.isArray(data) ? data[0] : data)
  },
  delete: async (id) => {
    await supabaseRest.delete(`anniversaries?id=eq.${id}`, token())
    return { success: true }
  },
  // 把本人创建但缺 couple_id 的老数据补上当前 couple_id，保证双方共享一致
  migrateOwnerData: async () => {
    const cid = await getMyCoupleId()
    if (!cid) return
    const uid = currentUserId()
    const old = await supabaseRest.get(`anniversaries?select=id&owner_id=eq.${uid}&couple_id=is.null`, token())
    if (Array.isArray(old) && old.length) {
      await supabaseRest.patch(`anniversaries?owner_id=eq.${uid}&couple_id=is.null`, { couple_id: cid }, token())
    }
  },
  getPinned: async () => {
    const cid = await getMyCoupleId()
    const uid = currentUserId()
    let candidates = []
    if (cid) {
      const byCouple = await supabaseRest.get(`anniversaries?select=*&couple_id=eq.${cid}&pin_to_home=eq.true&order=updated_at.desc`, token())
      if (Array.isArray(byCouple)) candidates.push(...byCouple)
    }
    // 兼容老数据：couple_id 为空但仍是我创建的置顶
    const byOwner = await supabaseRest.get(`anniversaries?select=*&owner_id=eq.${uid}&couple_id=is.null&pin_to_home=eq.true&order=updated_at.desc`, token())
    if (Array.isArray(byOwner)) candidates.push(...byOwner)
    if (candidates.length === 0) return null
    // 取最近更新的一条作为首页置顶，保证双方一致
    candidates.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    return mapAnniversaryIn(candidates[0])
  },
  setPinned: async (id) => {
    const cid = await getMyCoupleId()
    if (!cid) throw new Error('尚未绑定情侣')
    // 同一对情侣只能有一个置顶，先取消其他的
    await supabaseRest.patch(`anniversaries?couple_id=eq.${cid}&pin_to_home=eq.true`, { pin_to_home: false }, token())
    const data = await supabaseRest.patch(`anniversaries?id=eq.${id}&select=*`, { pin_to_home: true }, token())
    return mapAnniversaryIn(Array.isArray(data) ? data[0] : data)
  },
  unpin: async (id) => {
    const data = await supabaseRest.patch(`anniversaries?id=eq.${id}&select=*`, { pin_to_home: false }, token())
    return mapAnniversaryIn(Array.isArray(data) ? data[0] : data)
  }
}

export const PhotoAPI = restApi('photos')

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return ''
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}小时${m}分钟` : `${h}小时`
}

function samePlace(a, b) {
  if (!a || !b) return false
  const R = 6371000
  const dLat = (a.latitude - b.latitude) * Math.PI / 180
  const dLon = (a.longitude - b.longitude) * Math.PI / 180
  const lat1 = a.latitude * Math.PI / 180
  const lat2 = b.latitude * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  const dist = 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return dist < 200
}

function mergeStayRecords(rows) {
  const sorted = [...(rows || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const stays = []
  let current = null
  for (const r of sorted) {
    if (current && samePlace(current, r)) {
      current.duration += r.duration || Math.max(1, Math.round((new Date(r.created_at) - new Date(current.started_at || current.created_at)) / 60000))
      current.updated_at = r.created_at
    } else {
      if (current) stays.push(current)
      current = { ...r, duration: r.duration || 0, started_at: r.started_at || r.created_at }
    }
  }
  if (current) stays.push(current)
  return stays.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export const LocationAPI = {
  get: async () => {
    const uid = currentUserId()
    const data = await supabaseRest.get(`locations?select=*&owner_id=eq.${uid}&order=created_at.desc&limit=1`, token())
    return Array.isArray(data) ? data[0] : data
  },
  update: async (item) => {
    const cid = await getMyCoupleId()
    const latest = await LocationAPI.get()
    let duration = item.duration || 0
    let name = item.name
    let icon = item.icon
    if (latest && samePlace(latest, item)) {
      duration = Math.max(1, Math.round((Date.now() - new Date(latest.started_at || latest.created_at).getTime()) / 60000))
      name = name || latest.name
      icon = icon || latest.icon
    }
    const payload = { ...withOwner(item), couple_id: cid, duration, name: name || item.address || '未知位置', icon: icon || '📍' }
    const data = await supabaseRest.post('locations?select=*', payload, token())
    return Array.isArray(data) ? data[0] : data
  },
  getPartner: async () => {
    const cid = await getMyCoupleId()
    if (!cid) return null
    const uid = currentUserId()
    const data = await supabaseRest.get(`locations?select=*&couple_id=eq.${cid}&owner_id=neq.${uid}&order=created_at.desc&limit=1`, token())
    return Array.isArray(data) ? data[0] : data
  },
  getHistory: async () => {
    const cid = await getMyCoupleId()
    const uid = currentUserId()
    if (!cid || !uid) return { data: [] }
    const data = await supabaseRest.get(`locations?select=*&couple_id=eq.${cid}&order=created_at.desc&limit=200`, token())
    return { data: mergeStayRecords(data || []) }
  },
  formatDuration
}
export const FinanceAPI = {
  list: async (page = 1, limit = 20) => {
    const from = (page - 1) * limit
    const data = await supabaseRest.get(`finances?select=*&order=happened_at.desc&limit=${limit}&offset=${from}`, token())
    return { data: data || [], total: data?.length || 0 }
  },
  create: async (item) => {
    const data = await supabaseRest.post('finances?select=*', withOwner(item), token())
    return Array.isArray(data) ? data[0] : data
  },
  update: async (id, item) => {
    const data = await supabaseRest.patch(`finances?id=eq.${id}&select=*`, item, token())
    return Array.isArray(data) ? data[0] : data
  },
  delete: async (id) => {
    await supabaseRest.delete(`finances?id=eq.${id}`, token())
    return { success: true }
  },
  getStats: async () => {
    const uid = currentUserId()
    const data = await supabaseRest.get(`finances?select=type,amount&owner_id=eq.${uid}`, token())
    let income = 0, expense = 0
    for (const r of data || []) {
      if (r.type === 'income') income += Number(r.amount)
      else expense += Number(r.amount)
    }
    return { income, expense, balance: income - expense }
  }
}

// ---------------------------------------------------------------------------
//  SharingAPI —— couple_shared_states（情侣共享状态双向同步）
// ---------------------------------------------------------------------------
export const SharingAPI = {
  getPreferences: async () => {
    const s = await SharingAPI.getState('preferences')
    return s.payload || {}
  },
  updatePreferences: async (preferences) => {
    const uid = currentUserId()
    if (!uid) throw new Error('未登录')
    const cur = (await SharingAPI.getState('preferences')).payload || {}
    return SharingAPI.putState('preferences', {
      ...cur,
      [uid]: { ...(cur[uid] || {}), ...preferences }
    })
  },
  getState: async (module) => {
    const cid = await getMyCoupleId()
    if (!cid) return { payload: null }
    const data = await supabaseRest.get(`couple_shared_states?select=state&couple_id=eq.${cid}&module=eq.${module}`, token())
    return { payload: Array.isArray(data) && data[0] ? data[0].state : null }
  },
  putState: async (module, payload) => {
    const cid = await getMyCoupleId()
    if (!cid) throw new Error('尚未绑定情侣')
    // 先尝试更新已有记录；不存在则插入
    const getRes = await SharingAPI.getState(module)
    if (getRes.payload !== null) {
      const data = await supabaseRest.patch(`couple_shared_states?couple_id=eq.${cid}&module=eq.${module}`, { state: payload, updated_at: new Date().toISOString() }, token())
      return { payload: Array.isArray(data) && data[0] ? data[0].state : payload }
    }
    const data = await supabaseRest.post(`couple_shared_states?select=*`, { couple_id: cid, module, state: payload }, token())
    return { payload: Array.isArray(data) && data[0] ? data[0].state : payload }
  }
}

// ---------------------------------------------------------------------------
//  ChatAPI —— chat_messages（轮询拉取，无 realtime 依赖）
// ---------------------------------------------------------------------------
export const ChatAPI = {
  list: async (afterId = null) => {
    const cid = await getMyCoupleId()
    if (!cid) return { data: [] }
    let path = `chat_messages?select=*&couple_id=eq.${cid}&order=created_at.asc`
    if (afterId) path += `&id=gt.${afterId}`
    const data = await supabaseRest.get(path, token())
    return { data: data || [] }
  },
  send: async (type, content, metadata = {}) => {
    const cid = await getMyCoupleId()
    if (!cid) throw new Error('尚未绑定情侣，无法聊天')
    const payload = { couple_id: cid, sender_id: currentUserId(), type, content, metadata: metadata || null }
    const data = await supabaseRest.post('chat_messages?select=*', payload, token())
    if (!data) throw new Error('消息发送失败：服务器未返回数据')
    return Array.isArray(data) ? data[0] : data
  },
  subscribe: (onInsert) => {
    // 降级为轮询：每秒拉取自增 id 之后的消息
    let lastId = null
    const timer = setInterval(async () => {
      try {
        const { data } = await ChatAPI.list(lastId)
        for (const m of data) {
          if (!lastId || m.id > lastId) { lastId = m.id; onInsert(m) }
        }
      } catch {}
    }, 1500)
    return () => clearInterval(timer)
  }
}

export const CallAPI = {
  list: async (limit = 50) => {
    const cid = await getMyCoupleId()
    if (!cid) return { data: [] }
    const data = await supabaseRest.get(`call_records?select=*&couple_id=eq.${cid}&order=created_at.desc&limit=${limit}`, token())
    return { data: data || [] }
  },
  record: async (calleeId, duration) => {
    const cid = await getMyCoupleId()
    const data = await supabaseRest.post('call_records?select=*', { couple_id: cid, caller_id: currentUserId(), callee_id: calleeId, duration }, token())
    return Array.isArray(data) ? data[0] : data
  }
}

export const CalmModeAPI = {
  get: async () => {
    const cid = await getMyCoupleId()
    if (!cid) return null
    const data = await supabaseRest.get(`calm_modes?select=*&couple_id=eq.${cid}&order=created_at.desc&limit=1`, token())
    return Array.isArray(data) ? data[0] : null
  },
  request: async (durationHours) => {
    const cid = await getMyCoupleId()
    const data = await supabaseRest.post('calm_modes?select=*', { couple_id: cid, requester_id: currentUserId(), duration_hours: durationHours, status: 'pending' }, token())
    return Array.isArray(data) ? data[0] : data
  },
  accept: async (id) => {
    const data = await supabaseRest.patch(`calm_modes?id=eq.${id}&select=*`, { status: 'active' }, token())
    return Array.isArray(data) ? data[0] : data
  },
  exit: async (id) => {
    const data = await supabaseRest.patch(`calm_modes?id=eq.${id}&select=*`, { status: 'ended' }, token())
    return Array.isArray(data) ? data[0] : data
  }
}

// 辅助：取当前用户 couple_id
async function getMyCoupleId() {
  const uid = currentUserId()
  if (!uid) return null
  const data = await supabaseRest.get(`profiles?select=couple_id&id=eq.${uid}`, token())
  return Array.isArray(data) && data[0] ? data[0].couple_id || null : null
}
