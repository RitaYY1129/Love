import { Capacitor, registerPlugin } from '@capacitor/core'

const WeChatAuth = registerPlugin('WeChatAuth')

export const isNativeWechatAvailable = () => Capacitor.getPlatform() === 'android'

export const requestWechatCode = async () => {
  if (!isNativeWechatAvailable()) {
    throw new Error('微信授权登录需要在 Android App 中使用')
  }
  const result = await WeChatAuth.login()
  if (!result?.code) {
    throw new Error('未收到微信授权码')
  }
  return result.code
}

