import ProductDetail from '@/components/ProductDetail'
import SiteHeader from '@/components/SiteHeader'
import { ProductRecommendations } from '@/components/RecommendationSections'
export default function Page({params}:{params:{slug:string}}){return <main className="min-h-screen bg-cream"><SiteHeader/><ProductDetail slug={params.slug}/><ProductRecommendations slug={params.slug}/></main>}
