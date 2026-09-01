import ProductDetail from '@/components/ProductDetail'
import SiteHeader from '@/components/SiteHeader'
import { ProductRecommendations } from '@/components/RecommendationSections'

export default function ProductRouteView({ slug }: { slug: string }) {
  return <main className="min-h-screen bg-cream"><SiteHeader/><ProductDetail slug={slug}/><ProductRecommendations slug={slug}/></main>
}
