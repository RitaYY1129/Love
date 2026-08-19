// ============================================================================
//  Supabase 云后端适配层（手写 fetch，无需额外依赖；账号存于 profiles 表）
//  身份方案 A：手机号/用户名 + bcrypt 密码哈希，直接存 profiles 表，不走 Supabase Auth。
//  所有功能（账号/情侣绑定/聊天/日记/共享状态...）统一走云端，手机/网页直接可用。
// ============================================================================
import bcrypt from 'bcryptjs'

const url = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Supabase anon key 是一个 JWT（三段式），其他字符串 PostgREST 会报 "Expected 3 parts in JWT"
const isJwt = (v) => typeof v === 'string' && v.split('.').length === 3 && v.split('.').every(Boolean)

const configured = () => {
  if (!url || !anonKey) {
    throw new Error('尚未配置 Supabase。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。')
  }
  if (!isJwt(anonKey)) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY 不是有效的 JWT。' +
      '注意：Supabase 新版 publishable key（sb_publishable_...）不能用于此处，' +
      '请从 Project Settings > API 复制真正的 anon / public key（eyJ... 三段式）。'
    )
  }
}

const request = async (path, options = {}, accessToken = null) => {
  configured()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000) // 15 秒超时，避免一直转圈
  try {
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken && isJwt(accessToken) ? accessToken : anonKey}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
    const response = await fetch(`${url}${path}`, {
      ...options,
      signal: controller.signal,
      headers
    })
    clearTimeout(timer)
    const text = await response.text()
    const data = text ? JSON.parse(text) : null
    if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || text || '请求失败')
    return data
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') throw new Error('请求超时，请检查网络')
    throw err
  }
}

// ---- 身份标识归一化 ----
const normalize = (v) => String(v || '').trim().toLowerCase()
const isPhone = (v) => /^1[3-9]\d{9}$/.test(v)

// 本地生成 token（自签 JWT 风格，仅用于前端会话标识，云端不校验）
function makeToken(userId) {
  return 'ld_' + userId + '_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function mapProfile(p) {
  if (!p) return null
  return {
    id: p.id,
    nickname: p.nickname || p.identifier,
    identifier: p.identifier,
    avatar: p.avatar || '',
    bio: p.bio || '',
    birthday: p.birthday || '',
    theme: p.theme || 'default',
    username: p.username || '',
    profile_data: p.profile_data || null,
    invite_code: p.invite_code || '',
    couple_id: p.couple_id || null,
    partner: p.partner || null
  }
}

// 附带 partner 信息
async function withPartner(p) {
  const u = mapProfile(p)
  if (u && u.couple_id) {
    const partners = await request(`/rest/v1/profiles?select=*&couple_id=eq.${u.couple_id}&id=neq.${u.id}`)
    const pr = Array.isArray(partners) ? partners[0] : null
    if (pr) {
      u.partner = mapProfile(pr)
      u.partner.couple_id = u.couple_id
    }
  }
  return u
}

export const supabaseAuth = {
  // 注册：插入 profiles（自动生成邀请码）
  async signUp({ username, identifier, password }) {
    const idVal = normalize(identifier)
    const nick = username || idVal
    const code = 'LOVE' + Math.random().toString(36).slice(2, 10).toUpperCase()
    const password_hash = await bcrypt.hash(password, 10)
    const existing = await request(`/rest/v1/profiles?select=id&identifier=eq.${encodeURIComponent(idVal)}`)
    if (Array.isArray(existing) && existing.length) {
      return { ok: false, message: '该手机号/用户名已被注册' }
    }
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const data = await request('/rest/v1/profiles?select=*', {
      method: 'POST',
      body: JSON.stringify([{ id, username: nick, identifier: idVal, nickname: nick, invite_code: code, password_hash }]),
      headers: { Prefer: 'return=representation' }
    }, anonKey)
    const p = Array.isArray(data) ? data[0] : data
    if (!p) return { ok: false, message: '注册后未返回用户信息，请重试' }
    const user = mapProfile(p)
    return { ok: true, token: makeToken(user.id), user, message: '注册成功，请登录' }
  },

  // 登录：查 profiles 比对密码哈希
  async signIn(identifier, password) {
    const idVal = normalize(identifier)
    try {
      const rows = await request(`/rest/v1/profiles?select=*&identifier=eq.${encodeURIComponent(idVal)}`)
      const p = Array.isArray(rows) ? rows[0] : null
      if (!p) return { ok: false, message: '账号不存在，请先注册' }
      if (!p.password_hash) return { ok: false, message: '该账号未设置密码，请使用注册或重置' }
      const ok = await bcrypt.compare(password, p.password_hash)
      if (!ok) return { ok: false, message: '手机号或密码错误' }
      const user = await withPartner(p)
      return { ok: true, token: makeToken(user.id), user }
    } catch (e) {
      console.error('signIn error:', e)
      return { ok: false, message: e.message || '登录失败，请检查网络或 Supabase 配置' }
    }
  },

  async signInWithWechat() {
    return { ok: false, message: '微信登录暂未配置' }
  },

  async resetPassword(identifier, newPassword) {
    const idVal = normalize(identifier)
    try {
      const rows = await request(`/rest/v1/profiles?select=*&identifier=eq.${encodeURIComponent(idVal)}`)
      const p = Array.isArray(rows) ? rows[0] : null
      if (!p) return { ok: false, message: '该手机号尚未注册，请先注册' }
      const password_hash = await bcrypt.hash(newPassword, 10)
      await request(`/rest/v1/profiles?identifier=eq.${encodeURIComponent(idVal)}`, {
        method: 'PATCH',
        body: JSON.stringify({ password_hash }),
        headers: { Prefer: 'return=representation' }
      })
      return { ok: true, message: '密码已重置，请用新密码登录' }
    } catch (e) {
      console.error('resetPassword error:', e)
      return { ok: false, message: e.message || '重置失败，请检查网络或 Supabase 配置' }
    }
  },

  async getProfile() {
    const raw = localStorage.getItem('loveDiary_user')
    if (!raw) return { ok: false, message: '未登录' }
    const local = JSON.parse(raw)
    const rows = await request(`/rest/v1/profiles?select=*&id=eq.${local.id}`)
    const p = Array.isArray(rows) ? rows[0] : null
    if (!p) return { ok: false, message: '账号不存在' }
    const user = await withPartner(p)
    return { ok: true, token: local.id ? makeToken(user.id) : '', user }
  },

  async updateProfile(payload) {
    const raw = localStorage.getItem('loveDiary_user')
    if (!raw) return { ok: false, message: '未登录' }
    const local = JSON.parse(raw)
    const data = await request(`/rest/v1/profiles?select=*&id=eq.${local.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { Prefer: 'return=representation' }
    })
    const p = Array.isArray(data) ? data[0] : data
    const user = await withPartner(p)
    return { ok: true, user }
  },

  async bindPartner(inviteCode) {
    try {
      const raw = localStorage.getItem('loveDiary_user')
      if (!raw) return { ok: false, message: '未登录' }
      const local = JSON.parse(raw)
      const rows = await request(`/rest/v1/profiles?select=*&id=eq.${local.id}`)
      const me = Array.isArray(rows) ? rows[0] : null
      if (!me) return { ok: false, message: '账号不存在' }
      if (me.couple_id) return { ok: false, message: '你已经绑定了情侣' }
      const partners = await request(`/rest/v1/profiles?select=*&invite_code=eq.${encodeURIComponent(String(inviteCode).trim())}`)
      const partner = Array.isArray(partners) ? partners[0] : null
      if (!partner) return { ok: false, message: '邀请码无效' }
      if (partner.couple_id) return { ok: false, message: '对方已经绑定了其他人' }
      const coupleId = crypto.randomUUID()
      // UUID 字符串需加双引号，否则 PostgREST 解析失败
      await request(`/rest/v1/profiles?select=id&id=in.("${me.id}","${partner.id}")`, {
        method: 'PATCH',
        body: JSON.stringify({ couple_id: coupleId }),
        headers: { Prefer: 'return=minimal' }
      })
      const profileResult = await supabaseAuth.getProfile()
      if (!profileResult.ok) return { ok: false, message: '绑定成功，但刷新用户信息失败' }
      return { ok: true, message: '绑定成功', user: profileResult.user }
    } catch (e) {
      console.error('bindPartner error:', e)
      return { ok: false, message: e.message || '绑定失败' }
    }
  },

  async unbindPartner() {
    try {
      const raw = localStorage.getItem('loveDiary_user')
      if (!raw) return { ok: false, message: '未登录' }
      const local = JSON.parse(raw)
      const rows = await request(`/rest/v1/profiles?select=*&id=eq.${local.id}`)
      const me = Array.isArray(rows) ? rows[0] : null
      if (!me || !me.couple_id) return { ok: false, message: '尚未绑定' }
      await request(`/rest/v1/profiles?select=id&couple_id=eq.${me.couple_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ couple_id: null }),
        headers: { Prefer: 'return=minimal' }
      })
      const profileResult = await supabaseAuth.getProfile()
      if (!profileResult.ok) return { ok: false, message: '解绑成功，但刷新用户信息失败' }
      return { ok: true, message: '解绑成功', user: profileResult.user }
    } catch (e) {
      console.error('unbindPartner error:', e)
      return { ok: false, message: e.message || '解绑失败' }
    }
  }
}

// ---- REST 数据访问（PostgREST 风格，anon 可读写 profiles 等业务表）----
export const supabaseRest = {
  get(path, token) { return request(`/rest/v1/${path}`, {}, token) },
  post(path, body, token, headers = {}) {
    return request(`/rest/v1/${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { Prefer: 'return=representation', ...headers }
    }, token)
  },
  patch(path, body, token) {
    return request(`/rest/v1/${path}`, { method: 'PATCH', body: JSON.stringify(body), headers: { Prefer: 'return=representation' } }, token)
  },
  delete(path, token) {
    return request(`/rest/v1/${path}`, { method: 'DELETE' }, token)
  }
}

export const supabaseFunctions = {
  registerPhone: (payload) => request('/functions/v1/register-phone', { method: 'POST', body: JSON.stringify(payload) })
}

export const supabase = { url, anonKey }
