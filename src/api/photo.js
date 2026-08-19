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

export const PhotoAPI = {
  list: async () => {
    return await axiosInstance.get('/photos')
  },

  upload: async (item) => {
    return await axiosInstance.post('/photos', item)
  },

  update: async (id, item) => {
    return await axiosInstance.put(`/photos/${id}`, item)
  },

  delete: async (id) => {
    return await axiosInstance.delete(`/photos/${id}`)
  }
}