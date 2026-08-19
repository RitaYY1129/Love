import { SharingAPI } from '@/api'

export const hydrateSharedState = async (module, localPayload) => {
  try {
    const response = await SharingAPI.getState(module)
    if (response.payload === null || response.payload === undefined) {
      await SharingAPI.putState(module, localPayload)
      return { enabled: true, payload: localPayload }
    }
    return { enabled: true, payload: response.payload }
  } catch (error) {
    return { enabled: false, payload: localPayload, error }
  }
}

export const pushSharedState = async (module, payload) => {
  try {
    await SharingAPI.putState(module, payload)
    return true
  } catch {
    return false
  }
}
