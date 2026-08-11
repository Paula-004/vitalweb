'use client'
import { useSearchParams } from 'next/navigation'
import ProductRouteView from '@/components/ProductRouteView'

export default function MobileProductRoute() {
  const slug = useSearchParams().get('slug')?.trim()
  if (!slug) return <main className="grid min-h-screen place-items-center bg-cream p-6 text-center text-forest">No se indicó un producto.</main>
  return <ProductRouteView slug={slug}/>
}
