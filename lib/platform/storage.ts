export interface KeyValueStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

/**
 * Adaptador inicial compartido. Permite reemplazar sólo esta implementación por
 * Keychain/Keystore antes de publicar, sin cambiar autenticación, carrito o favoritos.
 */
export const webStorage: KeyValueStorage = {
  async get(key) {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
  },
  async set(key, value) {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value)
  },
  async remove(key) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key)
  },
}
