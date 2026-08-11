import CatalogPage from '@/components/CatalogPage'

const title = (slug: string) => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

export default function CategoryRouteView({ slug }: { slug: string }) {
  return <CatalogPage categorySlug={slug} eyebrow="Categoría" title={title(slug)} description="Encontrá todas las opciones disponibles en esta categoría."/>
}
