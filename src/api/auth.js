import axios from 'axios'

const API_BASE = import.meta.env.VITE_NATIVE_APP === 'true'
  ? (import.meta.env.VITE_API_BASE || 'http://localhost:3000/api')
  : '/api'

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('loveDiary_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('loveDiary_token')
      window.location.href = '/'
    }
    return Promise.reject(error.response?.data?.message || error.message)
  }
)

export const AuthAPI = {
  login: async (phone, password) => {
    return await axiosInstance.post('/auth/login', { phone, password })
  },

  register: async (phone, nickname, password) => {
    return await axiosInstance.post('/auth/register', { phone, nickname, password })
  },

  getProfile: async () => {
    return await axiosInstance.get('/auth/profile')
  },

  updateProfile: async (data) => {
    return await axiosInstance.put('/auth/profile', data)
  },

  bindPartner: async (partnerCode) => {
    return await axiosInstance.post('/auth/partner/bind', { partnerCode })
  },

  unbindPartner: async () => {
    return await axiosInstance.post('/auth/partner/unbind')
  }
}