/**
 * Los servicios detectan el navegador con `typeof window === 'undefined'`.
 * Estas pruebas corren en Node, así que se expone un `window`/`localStorage` mínimo
 * para poder ejercitar sesión, carrito y favoritos sin arrastrar jsdom.
 */
const store = new Map<string, string>()

const localStorageStub: Storage = {
  get length() { return store.size },
  clear: () => store.clear(),
  getItem: (key: string) => store.get(key) ?? null,
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  removeItem: (key: string) => { store.delete(key) },
  setItem: (key: string, value: string) => { store.set(key, String(value)) },
}

const globals = globalThis as unknown as { window: unknown; localStorage: Storage }
globals.window = globalThis
globals.localStorage = localStorageStub

export function clearStorage() {
  store.clear()
}
