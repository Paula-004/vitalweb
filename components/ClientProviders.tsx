'use client'
import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { FavoriteProvider } from '@/contexts/FavoriteContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
export default function ClientProviders({children}:{children:ReactNode}){return <NotificationProvider><AuthProvider><FavoriteProvider><CartProvider>{children}</CartProvider></FavoriteProvider></AuthProvider></NotificationProvider>}
