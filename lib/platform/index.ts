import { Capacitor } from '@capacitor/core'

export type AppPlatform = 'web' | 'android' | 'ios'

export const platform = {
  current(): AppPlatform {
    const value = Capacitor.getPlatform()
    return value === 'android' || value === 'ios' ? value : 'web'
  },
  isNative(): boolean {
    return Capacitor.isNativePlatform()
  },
  isWeb(): boolean {
    return !Capacitor.isNativePlatform()
  },
}
