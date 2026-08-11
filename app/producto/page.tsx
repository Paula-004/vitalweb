import { Suspense } from 'react'
import MobileProductRoute from '@/components/MobileProductRoute'
export default function Page() { return <Suspense fallback={<main className="min-h-screen bg-cream"/>}><MobileProductRoute/></Suspense> }
