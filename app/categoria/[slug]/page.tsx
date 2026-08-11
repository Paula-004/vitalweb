import CategoryRouteView from '@/components/CategoryRouteView'
export function generateStaticParams(){return [{slug:'_mobile'}]}
export default function Page({params}:{params:{slug:string}}){return <CategoryRouteView slug={params.slug}/>}
