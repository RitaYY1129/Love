import { Capacitor, registerPlugin } from '@capacitor/core'

const DeviceActivity = registerPlugin('DeviceActivity')

export const isDeviceActivityAvailable = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

export const hasUsageAccess = async () => {
  if (!isDeviceActivityAvailable()) return false
  const result = await DeviceActivity.hasUsageAccess()
  return Boolean(result.granted)
}

export const openUsageAccessSettings = async () => {
  if (!isDeviceActivityAvailable()) throw new Error('请在 Android App 中开启此权限')
  return DeviceActivity.openUsageAccessSettings()
}

export const getTodayUsage = async () => {
  if (!isDeviceActivityAvailable()) {
    throw new Error('网页端无法读取手机使用动态，请安装 Android 测试版')
  }
  return DeviceActivity.getTodayUsage()
}
