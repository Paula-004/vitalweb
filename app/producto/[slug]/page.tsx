import ProductRouteView from '@/components/ProductRouteView'
export function generateStaticParams(){return [{slug:'_mobile'}]}
export default function Page({params}:{params:{slug:string}}){return <ProductRouteView slug={params.slug}/>}
