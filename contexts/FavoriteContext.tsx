'use client'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { favoriteService } from '@/services'
const Context=createContext<null|{ids:string[];toggle:(id:string)=>void;has:(id:string)=>boolean}>(null)
export function FavoriteProvider({children}:{children:ReactNode}){const[ids,setIds]=useState<string[]>([]);useEffect(()=>setIds(favoriteService.load()),[]);const toggle=(id:string)=>setIds(current=>{const next=favoriteService.toggle(current,id);favoriteService.save(next);return next});return <Context.Provider value={{ids,toggle,has:id=>ids.includes(id)}}>{children}</Context.Provider>}
export function useFavorites(){const value=useContext(Context);if(!value)throw new Error('useFavorites debe usarse dentro de FavoriteProvider.');return value}
