import CatalogBrowser from './CatalogBrowser'
import SiteHeader from './SiteHeader'
import { CommercialHighlights } from './RecommendationSections'
import MarketingBanner from './MarketingBanner'
export default function CatalogPage(props:React.ComponentProps<typeof CatalogBrowser>){return <main className="min-h-screen bg-cream"><SiteHeader/><CatalogBrowser {...props}/><MarketingBanner/><CommercialHighlights/></main>}
