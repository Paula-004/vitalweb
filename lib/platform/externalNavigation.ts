import { platform } from './index'

export type ExternalNavigationTarget = 'same-window' | 'system-browser'

/** Punto único para sustituir por @capacitor/browser al adaptar enlaces externos. */
export async function openExternalUrl(url: string, target: ExternalNavigationTarget = 'system-browser') {
  if (typeof window === 'undefined') return
  if (platform.isNative() || target === 'system-browser') {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  window.location.assign(url)
}
