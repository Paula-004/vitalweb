import { Suspense } from 'react'
import AuthScreen from '@/components/AuthScreen'
// El backoffice envía el enlace con `?token=`; el token nunca se guarda en el navegador.
export default function Page(){return <Suspense><AuthScreen mode="reset"/></Suspense>}
