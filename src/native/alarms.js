import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const isNative = () => Capacitor.isNativePlatform()
const numericId = value => Math.abs([...String(value)].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) | 0, 17)) % 100000000

export const ensureAlarmPermission = async () => {
  if (!isNative()) {
    if (!('Notification' in window)) return false
    return Notification.permission === 'granted' || await Notification.requestPermission() === 'granted'
  }
  let permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
  if (permission.display !== 'granted') return false
  const exact = await LocalNotifications.checkExactNotificationSetting()
  if (exact.exact_alarm !== 'granted') {
    const updated = await LocalNotifications.changeExactNotificationSetting()
    if (updated.exact_alarm !== 'granted') throw new Error('请在系统设置中允许精确闹钟')
  }
  await Promise.all([
    LocalNotifications.createChannel({ id: 'love-default', name: '系统铃声', importance: 5, vibration: true }),
    LocalNotifications.createChannel({ id: 'love-gentle', name: '温柔提醒', sound: 'gentle.wav', importance: 5, vibration: true }),
    LocalNotifications.createChannel({ id: 'love-bell', name: '清脆铃声', sound: 'bell.wav', importance: 5, vibration: true })
  ])
  return true
}

export const cancelAlarm = async alarm => {
  if (!isNative() || !alarm?.notificationIds?.length) return
  await LocalNotifications.cancel({ notifications: alarm.notificationIds.map(id => ({ id })) })
}

export const scheduleAlarm = async alarm => {
  await cancelAlarm(alarm)
  if (!alarm.enabled) return []
  if (!await ensureAlarmPermission()) throw new Error('请开启通知权限')
  const [hour, minute] = alarm.time.split(':').map(Number)
  if (!isNative()) {
    const now = new Date()
    const at = new Date(now); at.setHours(hour, minute, 0, 0)
    if (at <= now) at.setDate(at.getDate() + 1)
    window.setTimeout(() => new Notification(alarm.title, { body: '情侣提醒时间到了' }), Math.min(at - now, 2147483647))
    return []
  }
  const baseId = numericId(alarm.id)
  const channelId = `love-${alarm.sound || 'default'}`
  const notifications = alarm.repeat?.length
    ? alarm.repeat.map((day, index) => ({ id: baseId + index, title: alarm.title, body: '情侣提醒时间到了', channelId, schedule: { on: { weekday: day + 1, hour, minute }, repeats: true, allowWhileIdle: true } }))
    : [{ id: baseId, title: alarm.title, body: '情侣提醒时间到了', channelId, schedule: { at: nextOccurrence(hour, minute), allowWhileIdle: true } }]
  await LocalNotifications.schedule({ notifications })
  return notifications.map(item => item.id)
}

const nextOccurrence = (hour, minute) => {
  const date = new Date(); date.setHours(hour, minute, 0, 0)
  if (date <= new Date()) date.setDate(date.getDate() + 1)
  return date
}

export const previewAlarmSound = sound => {
  const context = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = sound === 'bell' ? 880 : sound === 'gentle' ? 520 : 680
  gain.gain.setValueAtTime(.18, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .8)
  oscillator.connect(gain); gain.connect(context.destination)
  oscillator.start(); oscillator.stop(context.currentTime + .8)
}
