import Image from 'next/image'

export default function Logo({light=false}:{light?:boolean}){
 return <span className={`block h-28 w-28 shrink-0 overflow-hidden rounded-full sm:h-32 sm:w-32 ${light?'bg-cream':'bg-transparent'}`}>
  <Image
   src="/vital-food-logo-transparent.png"
   alt="Vital Food Viandas"
   width={767}
   height={767}
   priority
   sizes="(max-width: 640px) 112px, 128px"
   className="h-full w-full scale-[1.035] object-cover"
  />
 </span>
}
