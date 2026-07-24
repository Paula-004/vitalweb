'use client'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { useFavorites } from '@/contexts/FavoriteContext'
import { useNotification } from '@/contexts/NotificationContext'
export default function FavoriteButton({productId,className=''}:{productId:string;className?:string}){const favorites=useFavorites(),{notify}=useNotification(),active=favorites.has(productId);return <button aria-label={active?'Quitar de favoritos':'Agregar a favoritos'} aria-pressed={active} onClick={()=>{favorites.toggle(productId);notify(active?'Quitado de favoritos.':'Agregado a favoritos.','info')}} className={`grid place-items-center rounded-full bg-white text-orange shadow ${className}`}>{active?<HeartSolid className="h-5 w-5"/>:<HeartIcon className="h-5 w-5"/>}</button>}
