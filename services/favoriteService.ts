import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, useApiFor } from '@/lib/config'

const KEY = 'vitalweb-demo-favorites'
const endpoint = () => apiEndpoints.favorites as string

/** Acepta `["prod-1"]`, `[{productId}]` o `[{id}]` según cómo los devuelva el backoffice. */
function toProductIds(payload: unknown): string[] {
  const source = Array.isArray(payload) ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items) ? (payload as { items: unknown[] }).items
    : []
  return source
    .map(item => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        return String(record.productId ?? record.product_id ?? record.id ?? '')
      }
      return ''
    })
    .filter(Boolean)
}

export const favoriteService = {
  /**
   * El backoffice tiene endpoint de favoritos. No alcanza para usarlo: hace falta
   * además una sesión iniciada, por eso cada operación recibe `remote` desde el contexto.
   */
  get isRemoteEnabled() { return useApiFor(apiEndpoints.favorites) },

  loadLocal(): string[] {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
  },
  saveLocal(ids: string[]) {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(ids))
  },
  clearLocal() {
    if (typeof window !== 'undefined') localStorage.removeItem(KEY)
  },
  /** Cálculo puro de estado, sin transporte. */
  toggle(ids: string[], productId: string) {
    return ids.includes(productId) ? ids.filter(id => id !== productId) : [...ids, productId]
  },

  async list(remote: boolean): Promise<string[]> {
    if (!remote) return this.loadLocal()
    const response = await apiRequest<unknown>(endpoint())
    return toProductIds(response.data)
  },

  async add(productId: string, remote: boolean) {
    if (!remote) {
      const next = [...this.loadLocal().filter(id => id !== productId), productId]
      this.saveLocal(next)
      return next
    }
    await apiRequest(endpoint(), { method: 'POST', body: JSON.stringify({ productId }) })
    return this.list(true)
  },

  async remove(productId: string, remote: boolean) {
    if (!remote) {
      const next = this.loadLocal().filter(id => id !== productId)
      this.saveLocal(next)
      return next
    }
    await apiRequest(`${endpoint()}/${encodeURIComponent(productId)}`, { method: 'DELETE' })
    return this.list(true)
  },

  /**
   * Al iniciar sesión, los favoritos guardados en el navegador se suman a los de la
   * cuenta (unión: nunca se descarta lo que ya estaba en el servidor) y se limpia el
   * almacenamiento local para que deje de haber dos fuentes de verdad.
   */
  async mergeLocalIntoAccount(): Promise<string[]> {
    const local = this.loadLocal()
    const remote = await this.list(true)
    const pending = local.filter(id => !remote.includes(id))
    for (const productId of pending) {
      try {
        await apiRequest(endpoint(), { method: 'POST', body: JSON.stringify({ productId }) })
      } catch {
        // Un favorito que el backoffice rechaza (producto dado de baja) no debe frenar el login.
      }
    }
    this.clearLocal()
    return pending.length ? this.list(true) : remote
  },
}
