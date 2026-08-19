<template>
  <div class="chat-container">
    <header class="chat-header">
      <button class="header-left" aria-label="返回" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="header-center">
        <div class="partner-avatar">
          <img v-if="partnerAvatar" :src="partnerAvatar" alt="">
          <span v-else>{{ partnerName.slice(0, 1) }}</span>
        </div>
        <div class="partner-info">
          <div class="partner-name">{{ partnerName }}</div>
          <div class="partner-status">
            <span :class="['status-dot', { online: hasPartner }]"></span>
            <span class="status-text">{{ hasPartner ? '已绑定 · 私密会话' : '尚未绑定另一半' }}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button @click="router.push('/guardian')" class="call-btn guardian-btn" aria-label="守护动态"><span>♢</span></button>
        <button @click="toggleVoiceCall" class="call-btn voice-btn" aria-label="语音通话"><span>⌕</span></button>
        <button @click="toggleVideoCall" class="call-btn video-btn" aria-label="视频通话"><span>▻</span></button>
      </div>
    </header>

    <div class="chat-messages" ref="messagesContainer">
      <button
        v-if="hasPartner && !guardianSharingEnabled"
        class="guardian-setup-bar"
        type="button"
        @click="router.push('/guardian')"
      >
        <span>🛡</span>
        <p><strong>守护动态尚未开启</strong><small>双方授权后，手机动态会直接出现在聊天里</small></p>
        <b>去开启 ›</b>
      </button>
      <div v-if="!timelineItems.length" class="chat-empty">
        <div class="empty-mark">♡</div>
        <strong>{{ hasPartner ? '从第一句话开始' : '先绑定另一半' }}</strong>
        <p>{{ hasPartner ? '文字、照片、语音和位置都会留在这段私密会话里。' : '绑定后，你们就能拥有只属于两个人的聊天空间。' }}</p>
        <button v-if="!hasPartner" @click="router.push('/me')">去绑定</button>
      </div>
      <template
        v-for="message in timelineItems"
        :key="message.id"
      >
        <div v-if="message.kind === 'guardian'" class="guardian-chat-event">
          <time>{{ message.time }}</time>
          <button type="button" @click="router.push('/guardian')">
            <span :class="['guardian-event-icon', message.eventType]">
              <img v-if="message.eventType === 'app' && message.appIcon" :src="message.appIcon" alt="">
              <template v-else>{{ guardianEventIcon(message) }}</template>
            </span>
            <p v-if="message.eventType === 'app'">
              TA 使用了 <strong>{{ message.appName }}</strong>，使用时长
              <em>{{ formatUsageDuration(message.durationMs) }}</em>
            </p>
            <p v-else-if="message.eventType === 'screen_on'">TA 打开了手机</p>
            <p v-else>TA 关闭了手机</p>
            <b>›</b>
          </button>
        </div>
        <div v-else-if="message.kind === 'call'" class="call-history-event">
          <time>{{ message.time }}</time>
          <button type="button" @click="redialFromHistory(message)">
            <span>{{ message.callType === 'video' ? '▻' : '⌕' }}</span>
            <p>
              <strong>{{ message.callType === 'video' ? '视频通话' : '语音通话' }}</strong>
              <small>{{ callHistoryLabel(message) }}</small>
            </p>
            <b>{{ message.duration ? formatCallDuration(message.duration) : '回拨 ›' }}</b>
          </button>
        </div>
        <div
          v-else
          :class="['message-item', message.isMine ? 'mine' : 'partner']"
        >
        <div v-if="!message.isMine" class="message-avatar">{{ partnerName.slice(0, 1) }}</div>
        <div class="message-content">
          <template v-if="message.type === 'text'">
            <span>{{ message.content }}</span>
          </template>
          <template v-else-if="message.type === 'voice'">
            <div class="voice-message">
              <button @click="toggleVoicePlay(message)" class="voice-btn">
                <span v-if="!message.isPlaying">▶</span>
                <span v-else>⏸</span>
              </button>
              <div class="voice-wave">
                <span 
                  v-for="i in 5" 
                  :key="i" 
                  :class="['wave-bar', message.isPlaying ? 'playing' : '']"
                  :style="{ animationDelay: `${i * 0.1}s` }"
                ></span>
              </div>
              <span class="voice-duration">{{ message.duration }}"</span>
            </div>
            <button v-if="message.transcript" class="transcript-btn" @click="message.showTranscript = !message.showTranscript">{{ message.showTranscript ? message.transcript : '转文字' }}</button>
          </template>
          <template v-else-if="message.type === 'image'">
            <img :src="message.content" class="image-message" />
          </template>
          <template v-else-if="message.type === 'video'">
            <video :src="message.content" class="video-message" controls playsinline></video>
          </template>
          <template v-else-if="message.type === 'location'">
            <button class="location-message" @click="openLocation(message)"><span>⌖</span><div><strong>{{ message.address || '共享位置' }}</strong><small>{{ Number(message.latitude).toFixed(5) }}, {{ Number(message.longitude).toFixed(5) }}</small></div></button>
          </template>
          <div class="bubble-time">{{ message.time }}</div>
        </div>
        </div>
      </template>
    </div>

    <div v-if="callModal" class="call-modal">
      <div :class="['call-screen', callType, callState]">
        <video ref="remoteVideo" :class="['remote-video', { 'audio-only': callType === 'voice' }]" autoplay playsinline></video>
        <video v-if="callType === 'video'" ref="localVideo" class="local-video" autoplay muted playsinline></video>
        <div class="call-backdrop"></div>
        <div class="call-partner-info">
          <div class="call-avatar">
            <img v-if="incomingCaller?.avatar || partnerAvatar" :src="incomingCaller?.avatar || partnerAvatar" alt="">
            <span v-else>{{ partnerName.slice(0, 1) }}</span>
          </div>
          <div class="call-name">{{ incomingCaller?.nickname || partnerName }}</div>
          <div class="call-status">{{ callStatusText }}</div>
        </div>
        <div v-if="callState === 'active'" class="call-timer">{{ callDuration }}</div>
        <div v-if="callState === 'incoming'" class="incoming-call-actions">
          <button class="reject-call" type="button" @click="rejectIncomingCall"><span>×</span><small>拒绝</small></button>
          <button class="accept-call" type="button" @click="acceptIncomingCall"><span>⌕</span><small>接听</small></button>
        </div>
        <div v-else class="call-actions">
          <button @click="toggleMute" :class="['call-action-btn', mute ? 'active' : '']">
            <span>{{ mute ? '🔇' : '🔊' }}</span>
          </button>
          <button v-if="callType === 'video'" @click="toggleVideo" :class="['call-action-btn', videoOn ? '' : 'active']">
            <span>{{ videoOn ? '📹' : '📷' }}</span>
          </button>
          <button @click="endCall" class="call-action-btn end-btn">
            <span>×</span>
          </button>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div class="input-wrapper">
        <button class="more-btn" :class="{ active: showTools }" @click="showTools = !showTools">＋</button>
        <textarea 
          v-model="inputText" 
          class="message-input" 
          rows="1"
          placeholder="发消息…"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <button @click="toggleEmoji" class="emoji-toggle">☺</button>
        <button 
          @click="sendMessage" 
          :disabled="!inputText.trim()"
          class="send-btn"
        >
          <span>↑</span>
        </button>
      </div>
      <div v-if="showTools" class="tool-tray">
        <button @click="selectImage"><span>▧</span><small>照片</small></button>
        <button @click="selectVideo"><span>▷</span><small>视频</small></button>
        <button @click="sendLocation"><span>⌖</span><small>位置</small></button>
        <button @click="toggleVoiceRecording"><span>{{ isRecording ? '■' : '◉' }}</span><small>{{ isRecording ? '结束' : '语音' }}</small></button>
      </div>
      <div v-if="isRecording" class="recording-indicator">
        <span class="recording-dot"></span>
        <span class="recording-text">正在录音... {{ recordingDuration }}"</span>
        <button @click="cancelRecording" class="cancel-btn">取消</button>
      </div>
      <div v-if="showEmoji" class="emoji-panel">
        <div class="emoji-grid">
        <button 
          v-for="emoji in emojis" 
          :key="emoji"
          @click="addEmoji(emoji)"
          class="emoji-btn"
        >
          {{ emoji }}
        </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CallAPI, ChatAPI, SharingAPI } from '@/api'
import { getTodayUsage, hasUsageAccess, isDeviceActivityAvailable } from '@/native/deviceActivity'
import { disconnectCallSocket, getCallSocket } from '@/realtime/callSocket'

const router = useRouter()
const authStore = useAuthStore()

const partnerName = computed(() => authStore.user?.partner?.nickname || '另一半')
const partnerAvatar = computed(() => authStore.user?.partner?.avatar || '')
const hasPartner = computed(() => Boolean(authStore.user?.partner))
const callStatusText = computed(() => ({
  incoming: `邀请你进行${callType.value === 'video' ? '视频' : '语音'}通话`,
  outgoing: '正在等待对方接听…',
  connecting: '正在建立安全连接…',
  active: callType.value === 'video' ? '视频通话中' : '语音通话中',
  ended: '通话已结束'
}[callState.value] || '准备通话'))

const messages = ref([])
const guardianActivity = ref({ apps: [], screenEvents: [] })
const guardianSharingEnabled = ref(false)
const callHistory = ref([])
const guardianEvents = computed(() => {
  if (!guardianSharingEnabled.value) return []
  const events = [
    ...(guardianActivity.value.apps || []).slice(0, 12),
    ...(guardianActivity.value.screenEvents || []).slice(0, 24)
  ]
  return events.map((event, index) => ({
    id: `guardian-${event.type}-${event.timestamp || 0}-${index}`,
    kind: 'guardian',
    eventType: event.type,
    appName: event.appName || '',
    appIcon: event.icon || '',
    durationMs: Number(event.durationMs || 0),
    timestamp: Number(event.timestamp || 0),
    createdAt: new Date(Number(event.timestamp || 0)).toISOString(),
    time: formatEventClock(event.timestamp)
  }))
})
const timelineItems = computed(() => {
  const msgs = messages.value.map(m => ({ ...normalizeMessage(m), kind: 'message' })).filter(Boolean)
  const calls = callHistory.value.map(call => ({
    ...call,
    id: `call-${call.id}`,
    kind: 'call',
    time: formatEventClock(call.createdAt)
  }))
  return [...msgs, ...guardianEvents.value, ...calls].sort((left, right) => {
    const leftTime = new Date(left.createdAt || left.timestamp || 0).getTime()
    const rightTime = new Date(right.createdAt || right.timestamp || 0).getTime()
    return leftTime - rightTime
  })
})

const inputText = ref('')
const isRecording = ref(false)
const recordingDuration = ref(0)
const showEmoji = ref(false)
const showTools = ref(false)
const callModal = ref(false)
const callType = ref('voice')
const callDuration = ref('00:00')
const callState = ref('idle')
const activeCall = ref(null)
const incomingCaller = ref(null)
const mute = ref(false)
const speaker = ref(true)
const videoOn = ref(true)
let recordingTimer = null
let callTimer = null
let mediaRecorder = null
let recordingStream = null
let callStream = null
let peerConnection = null
let pendingIceCandidates = []
let callSocket = null
let callTimeout = null
let recognition = null
let voiceChunks = []
let voiceTranscript = ''
let discardRecording = false
let messagePollTimer = null
let lastRemoteMessageId = 0
let lastGuardianSyncAt = 0
const localVideo = ref(null)
const remoteVideo = ref(null)

const emojis = [
  '🥰', '😘', '😊', '🤭', '🥺', '😂', '😌', '😍',
  '❤️', '💕', '💗', '🌙', '✨', '🌹', '🫶', '抱抱'
]

const goBack = () => {
  router.push('/home')
}

const normalizeMessage = (raw) => {
  if (!raw) return null
  const myId = authStore.user?.id
  const senderId = raw.sender_id || raw.senderId
  const isMine = String(senderId) === String(myId)
  return {
    ...raw,
    id: raw.id,
    senderId,
    isMine,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    time: raw.time || formatEventClock(raw.created_at || raw.createdAt || Date.now())
  }
}

const appendRemoteMessage = message => {
  const normalized = normalizeMessage(message)
  if (!normalized) return
  if (messages.value.some(item => Number(item.id) === Number(normalized.id))) return
  messages.value.push(normalized)
  messages.value.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
  lastRemoteMessageId = Math.max(lastRemoteMessageId, Number(normalized.id) || 0)
  persistMessages()
  scrollToBottom()
}

const sendMessage = async () => {
  if (!inputText.value.trim()) return
  if (!hasPartner.value) return alert('请先在“我的”页面绑定另一半')
  const content = inputText.value.trim()
  inputText.value = ''
  try {
    const message = await ChatAPI.send('text', content)
    appendRemoteMessage(message)
  } catch (error) {
    inputText.value = content
    alert(error?.message || '消息发送失败')
  }
}

const toggleVoiceRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

const startRecording = async () => {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return alert('当前设备不支持录音')
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    voiceChunks = []; voiceTranscript = ''; discardRecording = false
    mediaRecorder = new MediaRecorder(recordingStream)
    mediaRecorder.ondataavailable = event => event.data.size && voiceChunks.push(event.data)
    mediaRecorder.onstop = async () => {
      if (discardRecording || !voiceChunks.length) return
      const duration = Math.max(1, recordingDuration.value)
      const blob = new Blob(voiceChunks, { type: mediaRecorder.mimeType || 'audio/webm' })
      if (blob.size > 4.5 * 1024 * 1024) {
        recordingDuration.value = 0
        return alert('语音太长，请控制在约 60 秒内')
      }
      const reader = new FileReader()
      reader.onload = async event => {
        try {
          const message = await ChatAPI.send('voice', event.target.result, { duration, transcript: voiceTranscript })
          appendRemoteMessage({ ...message, isPlaying: false })
        } catch (error) { alert(error?.message || '语音发送失败') }
      }
      reader.readAsDataURL(blob)
      recordingDuration.value = 0
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (Recognition) {
      recognition = new Recognition(); recognition.lang = 'zh-CN'; recognition.continuous = true
      recognition.onresult = event => { voiceTranscript = [...event.results].map(result => result[0].transcript).join('') }
      try { recognition.start() } catch {}
    }
    mediaRecorder.start()
  } catch { return alert('请允许麦克风权限后重试') }
  isRecording.value = true
  recordingDuration.value = 0
  recordingTimer = setInterval(() => {
    recordingDuration.value++
  }, 1000)
}

const stopRecording = () => {
  isRecording.value = false
  clearInterval(recordingTimer)
  recognition?.stop(); mediaRecorder?.stop(); recordingStream?.getTracks().forEach(track => track.stop())
}

const cancelRecording = () => {
  discardRecording = true
  isRecording.value = false
  clearInterval(recordingTimer)
  recognition?.stop(); if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
  recordingStream?.getTracks().forEach(track => track.stop())
  recordingDuration.value = 0
}

const toggleVoicePlay = (message) => {
  if (!message.content) return
  const audio = new Audio(message.content); message.isPlaying = true
  audio.onended = () => { message.isPlaying = false }; audio.play().catch(() => { message.isPlaying = false })
}

const toggleEmoji = () => {
  showEmoji.value = !showEmoji.value
  showTools.value = false
}

const addEmoji = (emoji) => {
  inputText.value += emoji
}

const compressChatImage = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = reject
  reader.onload = event => {
    const image = new Image()
    image.onerror = reject
    image.onload = () => {
      const maxSide = 1280
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', .76))
    }
    image.src = event.target.result
  }
  reader.readAsDataURL(file)
})

const selectImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const content = await compressChatImage(file)
      const message = await ChatAPI.send('image', content)
      appendRemoteMessage(message)
    } catch (error) { alert(error?.message || '照片发送失败') }
  }
  input.click()
}

const selectVideo = () => {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'video/*'
  input.onchange = event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return alert('内部测试版视频暂时不能超过 5MB')
    const reader = new FileReader()
    reader.onload = async e => {
      try {
        const message = await ChatAPI.send('video', e.target.result, { fileName: file.name })
        appendRemoteMessage(message)
      } catch (error) { alert(error?.message || '视频发送失败') }
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

const sendLocation = () => {
  if (!navigator.geolocation) return alert('当前设备不支持定位')
  navigator.geolocation.getCurrentPosition(async position => {
    try {
      const metadata = { latitude: position.coords.latitude, longitude: position.coords.longitude, address: '我的当前位置' }
      const message = await ChatAPI.send('location', '我的当前位置', metadata)
      appendRemoteMessage(message)
    } catch (error) { alert(error?.message || '位置发送失败') }
  }, () => alert('请允许定位权限后重试'), { enableHighAccuracy: true, timeout: 10000 })
}
const openLocation = message => window.open(`https://uri.amap.com/marker?position=${message.longitude},${message.latitude}&name=${encodeURIComponent(message.address || '共享位置')}`, '_blank')

const toggleVoiceCall = () => {
  startCall('voice')
}

const toggleVideoCall = () => {
  startCall('video')
}

const emitCallEvent = (event, payload = {}) => new Promise(resolve => {
  if (!callSocket) return resolve({ ok: false, message: '实时通话服务未连接' })
  callSocket.emit(event, payload, response => resolve(response || { ok: false }))
})

const mediaConstraints = type => ({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: type === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false
})

const openLocalMedia = async type => {
  try {
    callStream = await navigator.mediaDevices.getUserMedia(mediaConstraints(type))
  } catch {
    throw new Error(`请允许${type === 'video' ? '摄像头和麦克风' : '麦克风'}权限后重试`)
  }
  await nextTick()
  if (localVideo.value && type === 'video') localVideo.value.srcObject = callStream
  return callStream
}

const iceServers = () => {
  const servers = [{ urls: 'stun:stun.l.google.com:19302' }]
  if (import.meta.env.VITE_TURN_URL) {
    servers.push({
      urls: import.meta.env.VITE_TURN_URL,
      username: import.meta.env.VITE_TURN_USERNAME || '',
      credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
    })
  }
  return servers
}

const createPeer = () => {
  if (peerConnection) return peerConnection
  peerConnection = new RTCPeerConnection({ iceServers: iceServers() })
  callStream?.getTracks().forEach(track => peerConnection.addTrack(track, callStream))
  peerConnection.onicecandidate = event => {
    if (event.candidate && activeCall.value) {
      callSocket?.emit('call:signal', {
        callId: activeCall.value.id,
        signal: { type: 'candidate', candidate: event.candidate }
      })
    }
  }
  peerConnection.ontrack = async event => {
    const stream = event.streams?.[0] || new MediaStream([event.track])
    await nextTick()
    if (remoteVideo.value) {
      remoteVideo.value.srcObject = stream
      remoteVideo.value.play().catch(() => {})
    }
  }
  peerConnection.onconnectionstatechange = () => {
    if (peerConnection?.connectionState === 'connected') {
      callState.value = 'active'
      startCallTimer()
    }
    if (['failed', 'closed'].includes(peerConnection?.connectionState)) {
      finishCallLocally('通话连接已断开')
    }
  }
  return peerConnection
}

const flushIceCandidates = async () => {
  if (!peerConnection?.remoteDescription) return
  const candidates = [...pendingIceCandidates]
  pendingIceCandidates = []
  for (const candidate of candidates) {
    try { await peerConnection.addIceCandidate(candidate) } catch {}
  }
}

const handleCallSignal = async ({ callId, signal }) => {
  if (!activeCall.value || Number(callId) !== Number(activeCall.value.id) || !signal) return
  const peer = createPeer()
  try {
    if (signal.type === 'offer') {
      await peer.setRemoteDescription(signal)
      await flushIceCandidates()
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      callSocket.emit('call:signal', { callId, signal: peer.localDescription })
    } else if (signal.type === 'answer') {
      await peer.setRemoteDescription(signal)
      await flushIceCandidates()
    } else if (signal.type === 'candidate' && signal.candidate) {
      if (peer.remoteDescription) await peer.addIceCandidate(signal.candidate)
      else pendingIceCandidates.push(signal.candidate)
    }
  } catch (error) {
    console.warn('通话协商失败:', error)
  }
}

const startCall = async type => {
  if (!hasPartner.value) return alert('请先绑定另一半')
  if (callModal.value) return
  callType.value = type
  callState.value = 'outgoing'
  callModal.value = true
  try {
    await openLocalMedia(type)
    const response = await emitCallEvent('call:invite', { callType: type })
    if (!response.ok) throw new Error(response.message || '呼叫失败')
    activeCall.value = response.call
    if (!response.partnerOnline) showToast('对方当前不在线，已留下呼叫记录')
    clearTimeout(callTimeout)
    callTimeout = setTimeout(() => {
      if (callState.value === 'outgoing') endCall()
    }, 45000)
  } catch (error) {
    alert(error.message || '发起通话失败')
    cleanupCall()
  }
}

const startCallTimer = () => {
  clearInterval(callTimer)
  callDuration.value = '00:00'
  let seconds = 0
  callTimer = setInterval(() => {
    seconds += 1
    callDuration.value = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  }, 1000)
}

const acceptIncomingCall = async () => {
  if (!activeCall.value) return
  try {
    callState.value = 'connecting'
    await openLocalMedia(callType.value)
    createPeer()
    const response = await emitCallEvent('call:accept', { callId: activeCall.value.id })
    if (!response.ok) throw new Error(response.message || '接听失败')
    activeCall.value = response.call
  } catch (error) {
    alert(error.message || '接听失败')
    await rejectIncomingCall()
  }
}

const rejectIncomingCall = async () => {
  if (activeCall.value) await emitCallEvent('call:reject', { callId: activeCall.value.id })
  cleanupCall()
  await loadCallHistory()
}

const endCall = async () => {
  if (activeCall.value) await emitCallEvent('call:end', { callId: activeCall.value.id })
  cleanupCall()
  await loadCallHistory()
}

const finishCallLocally = message => {
  if (message) showToast(message)
  cleanupCall()
  loadCallHistory()
}

const cleanupCall = () => {
  clearTimeout(callTimeout)
  clearInterval(callTimer)
  callTimer = null
  peerConnection?.close()
  peerConnection = null
  pendingIceCandidates = []
  callStream?.getTracks().forEach(track => track.stop())
  callStream = null
  if (localVideo.value) localVideo.value.srcObject = null
  if (remoteVideo.value) remoteVideo.value.srcObject = null
  callModal.value = false
  callState.value = 'idle'
  activeCall.value = null
  incomingCaller.value = null
  callDuration.value = '00:00'
  mute.value = false
  videoOn.value = true
}

const toggleMute = () => {
  mute.value = !mute.value
  callStream?.getAudioTracks().forEach(track => { track.enabled = !mute.value })
}

const toggleSpeaker = () => {
  speaker.value = !speaker.value
}

const toggleVideo = () => {
  videoOn.value = !videoOn.value
  callStream?.getVideoTracks().forEach(track => { track.enabled = videoOn.value })
}

const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector('.chat-messages')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}
const nowTime = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
function formatEventClock(timestamp) {
  if (!timestamp) return ''
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
const formatUsageDuration = milliseconds => {
  const minutes = Math.max(0, Math.round(Number(milliseconds || 0) / 60000))
  if (minutes < 1) return '少于 1 分钟'
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`
}
const guardianEventIcon = message => {
  if (message.eventType === 'screen_on') return '▣'
  if (message.eventType === 'screen_off') return '▱'
  return (message.appName || 'A').slice(0, 1)
}
const persistMessages = () => {
  const serializable = messages.value.filter(item => item.type !== 'video').slice(-200)
  localStorage.setItem('loveDiary_chatMessages', JSON.stringify(serializable))
}

const loadRemoteMessages = async (replace = false) => {
  if (!hasPartner.value) return
  try {
    const result = await ChatAPI.list()
    const remote = result.data || result.messages || []
    if (replace) {
      messages.value = []
      lastRemoteMessageId = 0
    }
    remote.forEach(appendRemoteMessage)
  } catch (error) {
    console.warn('聊天同步失败:', error.message)
  }
}

const loadGuardianActivity = async () => {
  if (!hasPartner.value) {
    guardianSharingEnabled.value = false
    guardianActivity.value = { apps: [], screenEvents: [] }
    return
  }
  try {
    const preferences = await SharingAPI.getPreferences()
    guardianSharingEnabled.value = Boolean(preferences.effective?.device_activity)
    if (!guardianSharingEnabled.value) {
      guardianActivity.value = { apps: [], screenEvents: [] }
      return
    }
    let response = await SharingAPI.getState('device_activity')
    if (
      isDeviceActivityAvailable()
      && Date.now() - lastGuardianSyncAt > 60000
      && await hasUsageAccess().catch(() => false)
    ) {
      const usage = await getTodayUsage()
      const payload = response.payload && typeof response.payload === 'object' ? response.payload : {}
      payload[String(authStore.user.id)] = {
        ...usage,
        nickname: authStore.user.nickname,
        avatar: authStore.user.avatar || ''
      }
      response = await SharingAPI.putState('device_activity', payload)
      lastGuardianSyncAt = Date.now()
    }
    const partnerId = String(authStore.user?.partner?.id || '')
    const activity = response.payload?.[partnerId] || {}
    guardianActivity.value = {
      apps: Array.isArray(activity.apps) ? activity.apps : [],
      screenEvents: Array.isArray(activity.screenEvents) ? activity.screenEvents : []
    }
  } catch (error) {
    console.warn('守护动态同步失败:', error.message)
  }
}

const loadCallHistory = async () => {
  if (!hasPartner.value) {
    callHistory.value = []
    return
  }
  try {
    const response = await CallAPI.list(60)
    callHistory.value = Array.isArray(response.calls) ? response.calls : []
  } catch (error) {
    console.warn('通话记录加载失败:', error.message)
  }
}

const callHistoryLabel = call => {
  if (call.status === 'rejected') return call.isMine ? '对方已拒绝' : '已拒绝'
  if (call.status === 'missed' || (call.status === 'ended' && !call.answeredAt)) {
    return call.isMine ? '对方未接听' : '未接来电'
  }
  if (call.status === 'ringing') return call.isMine ? '呼叫中' : '来电'
  if (call.status === 'active') return '通话中'
  return call.isMine ? '已结束的呼叫' : '已接听'
}

const formatCallDuration = seconds => {
  const total = Math.max(0, Number(seconds || 0))
  if (total < 60) return `${total} 秒`
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

const redialFromHistory = call => {
  startCall(call.callType === 'video' ? 'video' : 'voice')
}

const initializeCallSocket = () => {
  callSocket = getCallSocket()
  callSocket.on('connect_error', error => {
    console.warn('实时通话连接失败:', error.message)
  })
  callSocket.on('call:incoming', ({ call, caller }) => {
    if (callModal.value) {
      callSocket.emit('call:reject', { callId: call.id })
      return
    }
    activeCall.value = call
    incomingCaller.value = caller || null
    callType.value = call.callType === 'video' ? 'video' : 'voice'
    callState.value = 'incoming'
    callModal.value = true
    loadCallHistory()
  })
  callSocket.on('call:accepted', async ({ call }) => {
    if (!activeCall.value || Number(call.id) !== Number(activeCall.value.id)) return
    clearTimeout(callTimeout)
    activeCall.value = call
    callState.value = 'connecting'
    const peer = createPeer()
    try {
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      callSocket.emit('call:signal', { callId: call.id, signal: peer.localDescription })
    } catch (error) {
      console.warn('创建通话连接失败:', error)
      endCall()
    }
  })
  callSocket.on('call:signal', handleCallSignal)
  callSocket.on('call:ended', ({ call, reason }) => {
    const text = reason === 'rejected' ? '对方已拒绝' : '通话已结束'
    if (activeCall.value && Number(call?.id) === Number(activeCall.value.id)) finishCallLocally(text)
    else loadCallHistory()
  })
}

onMounted(async () => {
  await authStore.refreshProfile()
  initializeCallSocket()
  try {
    const saved = JSON.parse(localStorage.getItem('loveDiary_chatMessages') || '[]')
    const demoTexts = new Set(['亲爱的，今天想我了吗？', '当然想啦！特别想你~', '晚上一起去吃饭吧', '好呀！想去吃什么？'])
    const local = saved.filter(item => !demoTexts.has(item.content) && !(item.type === 'voice' && !item.content))
    local.forEach(appendRemoteMessage)
  } catch {}
  await loadRemoteMessages(true)
  await loadGuardianActivity()
  await loadCallHistory()
  let guardianPollCount = 0
  messagePollTimer = window.setInterval(async () => {
    await authStore.refreshProfile()
    await loadRemoteMessages()
    guardianPollCount += 1
    if (guardianPollCount >= 4) {
      guardianPollCount = 0
      await loadGuardianActivity()
      await loadCallHistory()
    }
  }, 2500)
  scrollToBottom()
})
onBeforeUnmount(() => {
  clearInterval(recordingTimer); clearInterval(callTimer)
  clearInterval(messagePollTimer)
  clearTimeout(callTimeout)
  if (activeCall.value) callSocket?.emit('call:end', { callId: activeCall.value.id })
  cleanupCall()
  disconnectCallSocket()
  recordingStream?.getTracks().forEach(track => track.stop()); callStream?.getTracks().forEach(track => track.stop())
})
</script>

<style scoped>
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-header {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  padding-top: 50px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.header-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 20px;
  color: #333;
}

.header-center {
  flex: 1;
  text-align: center;
}

.partner-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.partner-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.partner-status {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.status-dot.online {
  background: #52c41a;
}

.status-text {
  font-size: 12px;
  color: #999;
}

.header-right {
  display: flex;
  gap: 15px;
}

.call-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;
}

.video-btn {
  background: #fff1f0;
}

.voice-btn {
  background: #f6ffed;
}

.call-btn:active {
  transform: scale(0.95);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  max-width: 80%;
}

.message-item.mine {
  align-items: flex-end;
}

.message-item.partner {
  align-items: flex-start;
}

.message-content {
  background: white;
  padding: 12px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-size: 15px;
  line-height: 1.5;
}

.message-item.mine .message-content {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
  border-radius: 20px 4px 20px 20px;
}

.message-item.partner .message-content {
  border-radius: 4px 20px 20px 20px;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
}

.message-item.mine .message-time {
  text-align: right;
}

.voice-message {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
}

.voice-message .voice-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-item.partner .voice-message .voice-btn {
  background: #f0f0f0;
  color: #666;
}

.voice-wave {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 1;
}

.wave-bar {
  width: 4px;
  height: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.message-item.partner .wave-bar {
  background: #ddd;
}

.wave-bar.playing {
  animation: wave 0.5s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { height: 8px; }
  50% { height: 20px; }
}

.voice-duration {
  font-size: 12px;
}

.image-message {
  max-width: 200px;
  max-height: 200px;
  border-radius: 10px;
  object-fit: cover;
}

.chat-input-area {
  background: white;
  padding: 15px 20px;
  padding-bottom: 35px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.input-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.input-action-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.input-action-btn:active {
  transform: scale(0.95);
  background: #eee;
}

.input-wrapper {
  display: flex;
  gap: 10px;
}

.message-input {
  flex: 1;
  height: 45px;
  border: none;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 0 20px;
  font-size: 15px;
  resize: none;
}

.send-btn {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 0 25px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.send-btn:active {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.5;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 15px;
  background: #fff1f0;
  border-radius: 25px;
}

.recording-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff4d4f;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.recording-text {
  flex: 1;
  font-size: 14px;
  color: #ff4d4f;
}

.cancel-btn {
  color: #ff4d4f;
  font-size: 14px;
  border: none;
  background: none;
}

.emoji-panel {
  background: white;
  padding: 15px;
  border-top: 1px solid #eee;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
}

.emoji-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.emoji-btn:active {
  background: #f5f5f5;
  transform: scale(0.95);
}

.call-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.call-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 40px;
}

.call-partner-info {
  text-align: center;
  margin-bottom: 30px;
}

.call-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 20px;
}

.call-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.call-name {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-bottom: 10px;
}

.call-status {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.call-timer {
  font-size: 48px;
  font-weight: bold;
  color: white;
  margin-bottom: 40px;
}

.call-actions {
  display: flex;
  gap: 30px;
}

.call-action-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
}

.call-action-btn.active {
  opacity: 0.5;
}

.call-action-btn:not(.end-btn) {
  background: rgba(255, 255, 255, 0.2);
}

.call-action-btn.end-btn {
  background: #ff4d4f;
}

.call-action-btn:active {
  transform: scale(0.95);
}
</style>
<style scoped>
.transcript-btn{display:block;margin:6px 0 0 auto;border:0;border-radius:8px;background:rgba(255,255,255,.22);color:inherit;padding:4px 7px;font-size:9px;max-width:210px}.video-message{width:min(260px,65vw);max-height:320px;border-radius:12px;background:#111}.location-message{display:flex;align-items:center;gap:10px;min-width:210px;border:0;background:transparent;color:inherit;text-align:left}.location-message>span{font-size:27px}.location-message strong,.location-message small{display:block}.location-message small{font-size:9px;opacity:.65;margin-top:4px}.local-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}.call-partner-info,.call-timer,.call-actions{position:relative;z-index:2}.calm-banner{padding:9px 14px;background:#f2ecff;color:#765b82;font-size:10px;text-align:center}.input-action-btn:disabled,.message-input:disabled{opacity:.4}
</style>
<style scoped>
.chat-container{height:100dvh;max-width:720px;margin:0 auto;background:linear-gradient(180deg,#fff9f8 0%,#fbf6f5 48%,#f8f2f2 100%);overflow:hidden}.chat-header{min-height:68px;padding:calc(8px + env(safe-area-inset-top)) 13px 8px;display:grid;grid-template-columns:40px 1fr auto;gap:8px;background:rgba(255,252,251,.94);border-bottom:1px solid #f0e1e3;box-shadow:none;backdrop-filter:blur(18px)}.header-left{width:38px;height:38px;border:1px solid #efdee1;border-radius:12px;background:#fff;color:#805e66}.header-center{min-width:0;display:flex;align-items:center;gap:9px;text-align:left}.partner-avatar,.message-avatar{display:grid;place-items:center;border-radius:50%;color:#fff;background:linear-gradient(145deg,#e77b8f,#b7617e)}.partner-avatar{flex:0 0 37px;width:37px;height:37px;font:600 13px Georgia}.partner-avatar img{width:100%;height:100%;border-radius:inherit;object-fit:cover}.partner-info{min-width:0;align-items:flex-start}.partner-name{max-width:150px;overflow:hidden;color:#553a42!important;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.partner-status{margin-top:2px}.status-dot{width:6px;height:6px}.status-text{color:#a08188;font-size:8px}.header-right{gap:6px}.call-btn{width:35px;height:35px;border:1px solid #efdee1;background:#fff!important;color:#a64e63;font-size:17px}.chat-messages{padding:18px 15px 22px;scroll-behavior:smooth}.chat-empty{height:100%;min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;color:#80636a}.chat-empty .empty-mark{width:66px;height:66px;display:grid;place-items:center;margin-bottom:15px;border-radius:23px;background:linear-gradient(145deg,#ffe9ed,#f4ecfb);color:#d15e75;font:32px Georgia}.chat-empty strong{font-size:14px}.chat-empty p{max-width:270px;margin-top:7px;color:#aa8d94;font-size:10px;line-height:1.6}.chat-empty button{margin-top:16px;padding:9px 18px;border:0;border-radius:13px;background:#d65d75;color:#fff;font-size:10px}.message-item{position:relative;display:grid;grid-template-columns:29px minmax(0,auto);align-items:end;column-gap:7px;max-width:86%;margin-bottom:13px}.message-item.mine{grid-template-columns:minmax(0,auto);justify-content:end;margin-left:auto}.message-item.partner{margin-right:auto}.message-avatar{width:29px;height:29px;font-size:9px}.message-content{position:relative;min-width:46px;padding:9px 12px 16px;border:1px solid #f0e1e3;border-radius:5px 17px 17px 17px!important;background:#fff!important;color:#5d454c!important;box-shadow:0 5px 17px rgba(99,60,69,.05);font-size:12px;line-height:1.55}.message-item.mine .message-content{grid-column:1;padding-right:12px;border:0;border-radius:17px 5px 17px 17px!important;background:linear-gradient(135deg,#dc687e,#bd536f)!important;color:#fff!important;box-shadow:0 6px 18px rgba(183,73,96,.17)}.bubble-time{position:absolute;right:8px;bottom:3px;font-size:7px;opacity:.48}.message-time{display:none}.image-message{max-width:min(230px,60vw);max-height:280px;margin:-6px -9px -12px;border-radius:12px}.voice-message{min-width:130px}.chat-input-area{padding:9px 11px calc(10px + env(safe-area-inset-bottom));border-top:1px solid #ecdde0;background:rgba(255,252,251,.97);box-shadow:0 -8px 28px rgba(97,57,67,.05);backdrop-filter:blur(18px)}.input-wrapper{align-items:flex-end;gap:7px}.more-btn,.emoji-toggle,.send-btn{flex:0 0 38px;width:38px;height:38px;padding:0;border-radius:12px}.more-btn,.emoji-toggle{border:1px solid #ecdde0;background:#fff;color:#9a747d;font-size:21px}.more-btn.active{transform:rotate(45deg);background:#fff0f2;color:#c04f67}.message-input{min-height:38px;height:38px;max-height:92px;padding:9px 12px;border:1px solid #eee0e2;border-radius:14px;background:#f8f2f2!important;color:#563e45;font-size:12px;line-height:19px}.send-btn{background:linear-gradient(145deg,#db637a,#bd536f)!important;border-radius:12px;font-size:20px}.tool-tray{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;padding:13px 2px 3px}.tool-tray button{padding:8px 2px;border:0;background:transparent;color:#806169}.tool-tray button>span{width:45px;height:45px;display:grid;place-items:center;margin:auto;border:1px solid #efdee1;border-radius:15px;background:#fff;font-size:19px;box-shadow:0 5px 14px rgba(99,60,69,.04)}.tool-tray small{display:block;margin-top:5px;font-size:8px}.emoji-panel{max-height:166px;overflow-y:auto;margin:9px -4px -3px;padding:9px;border:0;border-radius:15px;background:#fff8f8}.emoji-grid{grid-template-columns:repeat(8,1fr);gap:3px}.emoji-btn{width:100%;height:35px;font-size:19px}.recording-indicator{margin:9px 0 0;padding:8px 11px;border-radius:13px}.recording-text,.cancel-btn{font-size:10px}.call-screen{position:relative;width:100%;height:100%;justify-content:center}.call-avatar{background:linear-gradient(145deg,#e77b8f,#9b658a)}.call-avatar img[src=""]{display:none}.calm-banner{border-bottom:1px solid #e8dff0;line-height:1.5}@media(max-width:370px){.header-right .call-btn{width:32px;height:32px}.partner-avatar{display:none}.emoji-grid{grid-template-columns:repeat(6,1fr)}}

.guardian-chat-event{width:100%;margin:16px 0;text-align:center}.guardian-chat-event>time{display:block;margin-bottom:7px;color:#a3aab4;font-size:8px}.guardian-chat-event>button{max-width:94%;display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border:0;border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 3px 12px rgba(74,59,65,.045);color:#59616e;text-align:left}.guardian-event-icon{flex:0 0 20px;width:20px;height:20px;display:grid;place-items:center;overflow:hidden;border-radius:6px;background:var(--theme-primary);color:#fff;font-size:8px}.guardian-event-icon img{width:100%;height:100%;object-fit:cover}.guardian-event-icon.screen_on,.guardian-event-icon.screen_off{background:#fff0f1;color:#ec7680;font-size:14px}.guardian-chat-event p{font-size:9px;white-space:normal}.guardian-chat-event p strong,.guardian-chat-event p em{color:#149fe2;font-style:normal}.guardian-chat-event>button>b{color:#149fe2;font:16px Georgia}.guardian-btn span{color:var(--theme-primary)}
.guardian-setup-bar{width:100%;display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:9px 11px;border:1px solid color-mix(in srgb,var(--theme-primary) 16%,#eee);border-radius:14px;background:color-mix(in srgb,var(--theme-soft) 62%,#fff);text-align:left}.guardian-setup-bar>span{font-size:16px}.guardian-setup-bar p{min-width:0;flex:1}.guardian-setup-bar strong,.guardian-setup-bar small{display:block}.guardian-setup-bar strong{color:#765963;font-size:9px}.guardian-setup-bar small{margin-top:2px;color:#a2878e;font-size:7px}.guardian-setup-bar>b{color:var(--theme-primary);font-size:8px}
.call-history-event{width:100%;margin:15px 0;text-align:center}.call-history-event>time{display:block;margin-bottom:6px;color:#a6a0a4;font-size:8px}.call-history-event>button{display:inline-flex;align-items:center;gap:8px;min-width:210px;padding:8px 11px;border:1px solid color-mix(in srgb,var(--theme-primary) 12%,#eee);border-radius:15px;background:rgba(255,255,255,.92);box-shadow:0 4px 14px rgba(77,52,60,.05);text-align:left}.call-history-event>button>span{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:var(--theme-soft);color:var(--theme-primary);font-size:16px}.call-history-event p{min-width:0;flex:1}.call-history-event strong,.call-history-event small{display:block}.call-history-event strong{color:#655058;font-size:9px}.call-history-event small{margin-top:3px;color:#a58c92;font-size:7px}.call-history-event>button>b{color:var(--theme-primary);font-size:8px}

/* 聊天页跟随主题中心，不再固定为玫瑰粉 */
.chat-container{background:
  linear-gradient(rgba(255,255,255,calc(1 - var(--theme-background-opacity))),rgba(255,255,255,calc(1 - var(--theme-background-opacity)))),
  var(--theme-background-image) center/cover no-repeat,
  linear-gradient(180deg,color-mix(in srgb,var(--theme-soft) 74%,white),var(--theme-soft))!important}
.chat-header,.chat-input-area{background:color-mix(in srgb,var(--theme-soft) 38%,rgba(255,255,255,.95))!important;border-color:color-mix(in srgb,var(--theme-primary) 16%,white)!important}
.partner-avatar,.message-avatar,.call-avatar{background:linear-gradient(145deg,var(--theme-primary),color-mix(in srgb,var(--theme-primary) 66%,#765a8c))!important}
.message-item.mine .message-content{background:linear-gradient(135deg,var(--theme-primary),color-mix(in srgb,var(--theme-primary) 74%,#5f3648))!important;box-shadow:0 6px 18px color-mix(in srgb,var(--theme-primary) 24%,transparent)!important}
.send-btn{background:linear-gradient(145deg,var(--theme-primary),color-mix(in srgb,var(--theme-primary) 74%,#5f3648))!important}
.more-btn.active,.emoji-panel{background:var(--theme-soft)!important;color:var(--theme-primary)!important}
:global(html[data-chat-style="minimal"]) .message-item .message-content{border-radius:13px!important;box-shadow:none!important}
:global(html[data-chat-style="round"]) .message-item.partner .message-content{border-radius:7px 20px 20px 20px!important}
:global(html[data-chat-style="round"]) .message-item.mine .message-content{border-radius:20px 7px 20px 20px!important}

/* 更轻盈的输入框 */
.chat-input-area{padding:8px 10px calc(9px + env(safe-area-inset-bottom))!important}
.input-wrapper{display:flex;align-items:flex-end;gap:5px;padding:5px;border:1px solid color-mix(in srgb,var(--theme-primary) 13%,#e8dfe1);border-radius:21px;background:rgba(255,255,255,.96);box-shadow:0 8px 25px rgba(87,50,61,.085)}
.message-input{min-height:36px!important;height:36px;max-height:92px;padding:8px 7px!important;border:0!important;background:transparent!important;box-shadow:none!important;font-size:12px;line-height:20px}
.more-btn,.emoji-toggle{flex:0 0 35px!important;width:35px!important;height:35px!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#9e7e86!important}
.send-btn{flex:0 0 35px!important;width:35px!important;height:35px!important;border-radius:50%!important;box-shadow:0 5px 13px color-mix(in srgb,var(--theme-primary) 28%,transparent);font-size:18px!important}
.tool-tray{margin-top:8px;padding:12px 5px 5px!important;border:1px solid color-mix(in srgb,var(--theme-primary) 11%,#eee);border-radius:18px;background:rgba(255,255,255,.94)}
.tool-tray button>span{border:0!important;background:var(--theme-soft)!important;color:var(--theme-primary)}

/* 真实双人通话界面 */
.call-modal{z-index:500;background:#241a20}
.call-screen{position:relative;width:100%;max-width:720px;height:100dvh;overflow:hidden;padding:calc(78px + env(safe-area-inset-top)) 28px calc(34px + env(safe-area-inset-bottom));justify-content:flex-start;background:
  radial-gradient(circle at 50% 18%,color-mix(in srgb,var(--theme-primary) 42%,transparent),transparent 34%),
  linear-gradient(160deg,#4a303b,#21181e 70%)}
.remote-video{position:absolute;z-index:0;inset:0;width:100%;height:100%;object-fit:cover;background:#21181e}.remote-video.audio-only{opacity:0;pointer-events:none}.local-video{position:absolute;z-index:4;top:calc(18px + env(safe-area-inset-top));right:15px;inset-inline-start:auto;width:92px;height:132px;border:2px solid rgba(255,255,255,.65);border-radius:17px;object-fit:cover;opacity:1;box-shadow:0 8px 25px rgba(0,0,0,.24)}.call-backdrop{position:absolute;z-index:1;inset:0;background:linear-gradient(180deg,rgba(24,15,20,.18),rgba(24,15,20,.1) 45%,rgba(18,12,16,.64))}.call-screen.video.active .call-partner-info{opacity:0}.call-partner-info{position:relative;z-index:3;margin:7vh 0 0;text-align:center;transition:.3s}.call-avatar{width:104px;height:104px;display:grid;place-items:center;margin:0 auto 17px;border:3px solid rgba(255,255,255,.72);box-shadow:0 12px 38px rgba(0,0,0,.22);color:#fff;font:600 28px Georgia}.call-name{font-size:21px}.call-status{margin-top:7px;font-size:11px}.call-timer{position:relative;z-index:3;margin:16px 0 0;font-size:14px;font-weight:500}.call-actions,.incoming-call-actions{position:absolute;z-index:5;right:0;bottom:calc(35px + env(safe-area-inset-bottom));left:0;display:flex;align-items:center;justify-content:center;gap:22px}.call-action-btn,.incoming-call-actions button{width:56px;height:56px;border:0;border-radius:50%;color:#fff}.call-action-btn:not(.end-btn){background:rgba(255,255,255,.2);backdrop-filter:blur(12px)}.call-action-btn.end-btn,.reject-call{background:#ef5961}.call-action-btn.end-btn span,.incoming-call-actions button span{font-size:27px;line-height:1}.incoming-call-actions{gap:65px}.incoming-call-actions button{position:relative}.incoming-call-actions .accept-call{background:#46c778}.incoming-call-actions small{position:absolute;top:64px;left:50%;color:#fff;font-size:9px;transform:translateX(-50%);white-space:nowrap}
</style>

<style scoped>
/* 消息气泡美化：更圆润、时间更清晰 */
.message-item {
  margin-bottom: 16px;
}
.message-content {
  padding: 11px 14px 22px !important;
  border-radius: 18px 18px 18px 4px !important;
  box-shadow: 0 4px 14px rgba(99, 60, 69, 0.07) !important;
  font-size: 13px;
  line-height: 1.55;
}
.message-item.mine .message-content {
  border-radius: 18px 18px 4px 18px !important;
}
.message-item.partner .message-content {
  border-radius: 18px 18px 18px 4px !important;
}
.bubble-time {
  right: 10px;
  bottom: 5px;
  font-size: 9px;
  opacity: 0.62;
  letter-spacing: 0.2px;
}
.message-item.mine .bubble-time {
  color: rgba(255, 255, 255, 0.85);
  opacity: 0.8;
}
</style>
