'use client'
import Link from 'next/link'
import { Bars3Icon, XMarkIcon, ShoppingBagIcon, UserCircleIcon, HeartIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import Logo from './Logo'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

const links=[['/','Inicio'],['/menu-hoy','Menú de hoy'],['/menu-semanal','Menú semanal'],['/catalogo','Catálogo'],['/promociones','Promociones']]

export default function SiteHeader(){
 const[open,setOpen]=useState(false),{count}=useCart(),{session}=useAuth()
 return <header className="sticky top-0 z-30 border-b border-forest/10 bg-cream/95 backdrop-blur">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
   <Link href="/"><Logo/></Link>
   <nav className="hidden gap-7 text-xs font-extrabold text-forest lg:flex">{links.map(([href,label])=><Link key={href} href={href} className="hover:text-orange">{label}</Link>)}</nav>
   <div className="flex items-center gap-1 sm:gap-2">
    <Link href="/favoritos" aria-label="Mis favoritos" className="rounded-full p-2 text-forest hover:bg-white"><HeartIcon className="h-6"/></Link>
    <Link href={session?'/mi-cuenta':'/login'} className="flex items-center gap-2 rounded-full p-2 text-sm font-bold text-forest hover:bg-white sm:px-3"><UserCircleIcon className="h-6"/><span className="hidden sm:inline">{session?session.user.firstName:'Ingresar'}</span></Link>
    {!session&&<Link href="/registro" className="hidden rounded-full bg-orange px-4 py-3 text-xs font-extrabold text-white hover:bg-forest md:block">Crear cuenta</Link>}
    <Link href="/carrito" aria-label={`Carrito con ${count} productos`} className="relative flex items-center gap-2 rounded-full bg-forest p-3 text-white hover:bg-orange sm:px-4"><ShoppingBagIcon className="h-5"/><span className="hidden sm:inline text-xs font-extrabold">Carrito</span>{count>0&&<b className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange px-1 text-[9px] text-white">{count}</b>}</Link>
    <button className="p-2 lg:hidden" onClick={()=>setOpen(!open)} aria-label="Abrir navegación">{open?<XMarkIcon className="h-6"/>:<Bars3Icon className="h-6"/>}</button>
   </div>
  </div>
  {open&&<nav className="flex flex-col gap-4 border-t border-forest/10 px-5 py-5 text-sm font-bold lg:hidden">{links.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{label}</Link>)}<Link href="/favoritos">Mis favoritos</Link><Link href={session?'/mi-cuenta':'/login'}>{session?'Mi cuenta':'Ingresar'}</Link>{!session&&<Link href="/registro" className="text-orange">Crear cuenta</Link>}<Link href="/carrito">Carrito ({count})</Link></nav>}
 </header>
}
