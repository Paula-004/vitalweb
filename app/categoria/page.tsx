import { Suspense } from 'react'
import MobileCategoryRoute from '@/components/MobileCategoryRoute'
export default function Page() { return <Suspense fallback={<main className="min-h-screen bg-cream"/>}><MobileCategoryRoute/></Suspense> }
