import CatalogPage from '@/components/CatalogPage'
const title=(slug:string)=>slug.split('-').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ')
export default function Page({params}:{params:{slug:string}}){return <CatalogPage categorySlug={params.slug} eyebrow="Categoría" title={title(params.slug)} description="Encontrá todas las opciones disponibles en esta categoría."/>}
