import { defineStore } from 'pinia'
import { AuthAPI } from '@/api'
import { supabaseAuth } from '@/api/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    currentUser: (state) => state.user,
    partner: (state) => state.user?.partner || null,
    isLoggedIn: (state) => state.isAuthenticated && !!state.token
  },

  actions: {
    // ---- 初始化：从本地恢复会话 ----
    init() {
      const token = localStorage.getItem('loveDiary_token')
      const userRaw = localStorage.getItem('loveDiary_user')
      if (token && userRaw) {
        try {
          this.token = token
          this.user = JSON.parse(userRaw)
          this.isAuthenticated = true
        } catch (e) {
          this.logout()
        }
      }
    },

    _persist(token, user) {
      this.token = token
      this.user = user
      this.isAuthenticated = true
      localStorage.setItem('loveDiary_token', token)
      localStorage.setItem('loveDiary_user', JSON.stringify(user))
    },

    // ---- 登录 ----
    async login(identifier, password) {
      const result = await AuthAPI.login(identifier, password)
      if (result.ok) {
        this._persist(result.token, result.user)
        return { ok: true }
      }
      return { ok: false, message: result.message }
    },

    // ---- 注册 ----
    async register(payload) {
      const result = await AuthAPI.register(payload)
      if (result.ok) {
        // 注册后若直接返回会话则登录，否则提示去登录
        if (result.token && result.user) {
          this._persist(result.token, result.user)
        }
        return { ok: true, needLogin: !result.token, message: result.message }
      }
      return { ok: false, message: result.message }
    },

    // ---- 邮箱验证码 ----
    async sendEmailCode(email) {
      // 本地模拟：生成 6 位码存到 localStorage，控制台也会打印方便测试
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      localStorage.setItem(`email_code_${email}`, code)
      // eslint-disable-next-line no-console
      console.log(`[测试模式] 邮箱 ${email} 的验证码是：${code}`)
      return { ok: true, message: `验证码已发送，测试码：${code}` }
    },

    // ---- 手机号注册 ----
    async registerByPhone(username, identifier, password) {
      const result = await AuthAPI.register({ username, identifier, password })
      if (result.ok) {
        if (result.token && result.user) {
          this._persist(result.token, result.user)
        }
        return { ok: true, needLogin: !result.token, message: result.message }
      }
      return { ok: false, message: result.message }
    },

    // ---- 邮箱验证码注册 ----
    async registerByEmailCode(username, email, code, password) {
      const savedCode = localStorage.getItem(`email_code_${email}`)
      if (!savedCode || savedCode !== code) {
        return { ok: false, message: '验证码错误或已过期' }
      }
      localStorage.removeItem(`email_code_${email}`)
      const result = await AuthAPI.register({ username, identifier: email, password })
      if (result.ok) {
        if (result.token && result.user) {
          this._persist(result.token, result.user)
        }
        return { ok: true, needLogin: !result.token, message: result.message }
      }
      return { ok: false, message: result.message }
    },

    // ---- 重置密码（不需要原密码，按手机号直接修改）----
    async resetPassword(identifier, newPassword) {
      const result = await supabaseAuth.resetPassword(identifier, newPassword)
      if (result.ok) {
        return { ok: true, message: result.message || '密码已重置，请用新密码登录' }
      }
      return { ok: false, message: result.message }
    },

    // ---- 微信登录 ----
    async loginByWechat(code) {
      const result = await AuthAPI.loginByWechat(code)
      if (result.ok) {
        this._persist(result.token, result.user)
        return { ok: true }
      }
      return { ok: false, message: result.message }
    },

    // ---- 获取最新资料（含 partner）----
    async loadUser() {
      if (!this.token) return
      try {
        const result = await AuthAPI.getProfile()
        if (result.ok) {
          this.user = result.user
          localStorage.setItem('loveDiary_user', JSON.stringify(result.user))
        }
      } catch (e) {
        // 失败不阻塞页面
        console.warn('loadUser 失败:', e.message)
      }
    },

    // ---- 更新资料 ----
    async updateProfile(payload) {
      const result = await AuthAPI.updateProfile(payload)
      if (result.ok) {
        this.user = result.user
        localStorage.setItem('loveDiary_user', JSON.stringify(result.user))
        return { ok: true }
      }
      return { ok: false, message: result.message }
    },

    // ---- 绑定情侣 ----
    async bindPartner(inviteCode) {
      const result = await AuthAPI.bindPartner(inviteCode)
      if (result.ok) {
        // 重新拉取资料以更新 partner / couple_id
        await this.loadUser()
        return { ok: true, message: result.message }
      }
      return { ok: false, message: result.message }
    },

    async unbindPartner() {
      const result = await AuthAPI.unbindPartner()
      if (result.ok) {
        await this.loadUser()
        return { ok: true }
      }
      return { ok: false, message: result.message }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('loveDiary_token')
      localStorage.removeItem('loveDiary_user')
    },

    // 兼容旧代码：refreshProfile 是 loadUser 的别名
    async refreshProfile() {
      return this.loadUser()
    }
  }
})
