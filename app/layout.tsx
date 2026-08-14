import type { Metadata, Viewport } from 'next'
import { Manrope, Lora } from 'next/font/google'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'
const manrope=Manrope({subsets:['latin'],variable:'--font-manrope'})
const lora=Lora({subsets:['latin'],variable:'--font-lora'})
export const metadata:Metadata={title:'Vital Food | Viandas saludables',description:'Comida rica, equilibrada y lista para vos.'}
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f7f1e9'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body className={`${manrope.variable} ${lora.variable}`}><ClientProviders>{children}</ClientProviders></body></html>}
