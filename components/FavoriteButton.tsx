'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { HeartIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { useAuth } from '@/contexts/AuthContext'
import { useFavorites } from '@/contexts/FavoriteContext'
import { useNotification } from '@/contexts/NotificationContext'

export default function FavoriteButton({ productId, className = '' }: { productId: string; className?: string }) {
  const favorites = useFavorites()
  const { session, ready } = useAuth()
  const { notify } = useNotification()
  const pathname = usePathname()
  const [showAccountPrompt, setShowAccountPrompt] = useState(false)
  const active = favorites.has(productId)
  const next = encodeURIComponent(pathname || '/')

  const handleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!ready || !session) {
      setShowAccountPrompt(true)
      notify('Para guardar favoritos, iniciá sesión o creá tu cuenta.', 'info')
      return
    }

    favorites.toggle(productId)
    notify(active ? 'Quitado de favoritos.' : 'Agregado a favoritos.', 'info')
  }

  return (
    <>
      <button
        type="button"
        aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={active}
        onClick={handleFavorite}
        className={`grid place-items-center rounded-full bg-white text-orange shadow ${className}`}
      >
        {active ? <HeartSolid className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
      </button>

      {showAccountPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="favorite-account-title"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            if (event.target === event.currentTarget) setShowAccountPrompt(false)
          }}
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setShowAccountPrompt(false)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-stone-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <HeartIcon className="mx-auto mb-4 h-12 w-12 text-orange" />
            <h2 id="favorite-account-title" className="text-xl font-bold text-stone-900">Guardá tus favoritos en tu cuenta</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Para agregar este producto a favoritos tenés que iniciar sesión o registrarte.
            </p>
            <div className="mt-6 grid gap-3">
              <Link href={`/login?next=${next}`} className="rounded-full bg-green px-5 py-3 font-semibold text-white">
                Iniciar sesión
              </Link>
              <Link href={`/registro?next=${next}`} className="rounded-full border border-green px-5 py-3 font-semibold text-green">
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
