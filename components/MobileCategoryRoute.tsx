'use client'
import { useSearchParams } from 'next/navigation'
import CategoryRouteView from '@/components/CategoryRouteView'

export default function MobileCategoryRoute() {
  const slug = useSearchParams().get('slug')?.trim()
  if (!slug) return <main className="grid min-h-screen place-items-center bg-cream p-6 text-center text-forest">No se indicó una categoría.</main>
  return <CategoryRouteView slug={slug}/>
}
