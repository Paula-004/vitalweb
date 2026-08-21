'use client'
import Image from 'next/image'
import { useState } from 'react'

export default function ProductImage({src,alt,className='',priority=false,sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}:{src?:string;alt:string;className?:string;priority?:boolean;sizes?:string}){
 const [source,setSource]=useState(src||'')
 if(!source)return null
 return <div className={`relative overflow-hidden bg-[#e7dccb] ${className}`}><Image src={source} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" onError={()=>setSource('')}/></div>
}
