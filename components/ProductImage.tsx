'use client'
import Image from 'next/image'
import { useState } from 'react'

export default function ProductImage({src,alt,className='',priority=false,sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}:{src?:string;alt:string;className?:string;priority?:boolean;sizes?:string}){
 const [source,setSource]=useState(src||'')
 return <div className={`relative overflow-hidden bg-[#f3ede5] ${className}`}>{source&&<Image src={source} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" onError={()=>setSource('')}/>}</div>
}
