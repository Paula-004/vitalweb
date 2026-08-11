'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'

function ConfirmationContent(){
  const order = useSearchParams().get('order') ?? 'pendiente'
  return <main className="grid min-h-screen place-items-center bg-forest px-5"><div className="max-w-md rounded-[2rem] bg-cream p-8 text-center shadow-2xl"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange text-white"><CheckIcon className="h-8"/></span><p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-orange">Pedido confirmado</p><h1 className="mt-2 font-display text-4xl text-forest">¡Gracias por elegirnos!</h1><p className="mt-4 text-sm leading-6 text-ink/60">Tu número de pedido demo es <b className="text-forest">{order}</b>. Lo guardamos en el estado local de esta demostración.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/mi-cuenta" className="flex-1 rounded-full bg-orange px-5 py-3 text-sm font-bold text-white">Ver mis pedidos</Link><Link href="/" className="flex-1 rounded-full border px-5 py-3 text-sm font-bold">Volver al inicio</Link></div></div></main>
}

export default function Page(){return <Suspense fallback={<main className="min-h-screen bg-forest"/>}><ConfirmationContent/></Suspense>}
