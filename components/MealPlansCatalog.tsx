'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { promotionService } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { Promotion } from '@/types/domain'
import SiteHeader from './SiteHeader'

const labels: Record<string, string> = { DAY: 'Por día', WEEK: 'Por semana', MONTH: 'Por mes' }
const money = (value: number) => '$' + value.toLocaleString('es-AR')

export default function MealPlansCatalog() {
  const { session, ready } = useAuth()
  const [plans, setPlans] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    promotionService.getAll()
      .then(response => setPlans(response.data.filter(plan => plan.mealCount && plan.period)))
      .catch(() => setError('Estamos actualizando las promociones. Volvé a intentar en unos minutos.'))
      .finally(() => setLoading(false))
  }, [])

  return <main className="min-h-screen bg-cream">
    <SiteHeader />
    <section className="bg-forest px-5 py-16 text-cream lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-orange">Beneficios Vital</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl sm:text-6xl">Promos de viandas</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/65">
          Pagá tu paquete por día, semana o mes y elegí después qué viandas querés. Cada elección se descuenta de tu saldo.
        </p>
      </div>
    </section>
    <section className="grain min-h-[500px] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {loading && <p className="text-sm text-ink/60">Cargando promos...</p>}
        {error && <p className="rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-700">{error}</p>}
        {!loading && !error && !plans.length && <p className="rounded-2xl bg-white p-6 text-sm text-ink/60">Todavía no hay paquetes publicados.</p>}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map(plan => <article key={plan.id} className="rounded-[2rem] bg-white p-7 shadow-soft">
            <span className="rounded-full bg-orange/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-orange">{labels[plan.period ?? ''] ?? 'Promo'}</span>
            <h2 className="mt-4 font-display text-3xl text-forest">{plan.name}</h2>
            <p className="mt-3 min-h-12 text-sm leading-6 text-ink/60">{plan.description}</p>
            <div className="mt-6 border-y border-forest/10 py-5">
              <b className="text-5xl text-orange">{plan.mealCount}</b>
              <span className="ml-2 text-sm font-bold text-forest">viandas a favor</span>
            </div>
            <p className="mt-5 text-2xl font-extrabold text-forest">{money(plan.price ?? plan.value)}</p>
            <p className="mt-2 text-xs text-ink/50">Consultanos para activar el paquete en tu cuenta.</p>
            <div className="mt-6 flex gap-2">
              {ready && !session && (
                <Link href="/login?next=%2Fpromociones" className="flex-1 rounded-full bg-orange px-5 py-3 text-center text-sm font-bold text-white">
                  Iniciar sesión
                </Link>
              )}
              <a
                href={`https://wa.me/5493446205554?text=${encodeURIComponent(`Hola, quiero la promo ${plan.name} de ${plan.mealCount} viandas.`)}`}
                target="_blank"
                rel="noreferrer"
                className={`${ready && !session ? 'flex-1 border border-forest/15 text-forest' : 'w-full bg-orange text-white'} rounded-full px-5 py-3 text-center text-sm font-bold`}
              >
                La quiero
              </a>
            </div>
          </article>)}
        </div>
      </div>
    </section>
  </main>
}
