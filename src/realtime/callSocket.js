import { io } from 'socket.io-client'
import { useAuthStore } from '../stores/auth'

const socketBaseUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL
  const apiBase = import.meta.env.VITE_API_BASE
  if (apiBase && /^https?:\/\//i.test(apiBase)) {
    return new URL(apiBase).origin
  }
  return window.location.origin
}

// WebRTC TURN 中继（手机 4G/5G 网络穿透需要）
export function getTurnConfig() {
  const url = import.meta.env.VITE_TURN_URL
  if (!url) return null
  return {
    urls: url,
    username: import.meta.env.VITE_TURN_USERNAME || '',
    credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
  }
}

export const getCallSocket = () => {
  if (!socket) {
    const authStore = useAuthStore()
    const userId = authStore.user?.id || ''
    const coupleId = authStore.user?.couple_id || ''
    socket = io(socketBaseUrl(), {
      auth: { userId, coupleId },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 800,
      reconnectionAttempts: Infinity
    })
  } else {
    const authStore = useAuthStore()
    socket.auth = {
      userId: authStore.user?.id || '',
      coupleId: authStore.user?.couple_id || ''
    }
  }
  if (!socket.connected) socket.connect()
  return socket
}

export const disconnectCallSocket = () => {
  socket?.disconnect()
  socket = null
}
