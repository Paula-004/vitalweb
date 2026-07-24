'use client'
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

const plans=[
 {name:'General',price:8500,tone:'bg-[#f0e4d5]',description:'Una opción equilibrada, casera y abundante.',examples:['Guisito de lentejas, carnes y verduras con queso sardo','Pollo al verdeo con calabaza y arroz','Tarta caprese con ensalada fresca']},
 {name:'Keto',price:8500,tone:'bg-[#e5eadc]',description:'Menos carbohidratos, mucho sabor y saciedad.',examples:['Cubos de pollo con salsa de verdeo y calabaza gratinada','Pollo, brócoli, jamón y queso','Ensalada César sin croutones']},
 {name:'Veggie',price:8500,tone:'bg-[#eef0dc]',description:'Vegetales, legumbres y quesos en combinaciones completas.',examples:['Guisito de lentejas y verduras con queso sardo','Ravioles de verdura con salsa boloñesa veggie','Tarta de acelga, calabaza, choclo y queso']},
 {name:'Proteico',price:9500,tone:'bg-[#eadfd3]',description:'Una alternativa potente con proteína extra.',examples:['Guisito de lentejas, carnes, verduras y huevo','Pollo al verdeo con huevo y vegetales','Ensalada de pollo, huevo, palta y parmesano']},
]

const extras=[
 {title:'Ensaladas',items:['Pasta corta, pollo, rúcula y parmesano','Quinoa, lentejas, pollo, huevo y vegetales','César con pollo y huevo']},
 {title:'Pastas',items:['Ravioles de verdura','Sorrentinos de jamón y queso','Tallarines con salsa boloñesa']},
 {title:'Tartas',items:['Pollo, calabaza y roquefort','Brócoli, jamón y queso','Caprese']},
 {title:'Postres',items:['Ensalada de frutas · $3.500','Cheesecake keto · $5.000','Chocotorta saludable · $5.000']},
]

export default function MenuOptions(){
 const[selected,setSelected]=useState('General'),[confirmed,setConfirmed]=useState(false)
 return <section id="menu" className="grain px-5 py-24 lg:px-8">
  <div className="mx-auto max-w-7xl">
   <div className="max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[.22em] text-orange">Menús Vital</p><h2 className="mt-3 font-display text-4xl font-semibold text-forest sm:text-5xl">Elegí tu propio menú</h2><p className="mt-4 text-sm leading-6 text-ink/65">Seleccioná el estilo que mejor acompaña tu día. Estos platos son ejemplos demostrativos y pueden variar según disponibilidad.</p></div>
   <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{plans.map(plan=>{const active=selected===plan.name;return <button key={plan.name} onClick={()=>setSelected(plan.name)} className={`relative overflow-hidden rounded-[1.75rem] border p-6 text-left shadow-soft transition ${active?'border-orange ring-2 ring-orange/20':'border-forest/10 hover:-translate-y-1'} ${plan.tone}`}><div className="flex items-start justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange">Menú</p><h3 className="mt-2 text-2xl font-extrabold uppercase text-forest">{plan.name}</h3></div>{active&&<span className="grid h-8 w-8 place-items-center rounded-full bg-orange text-white"><CheckIcon className="h-5"/></span>}</div><p className="mt-2 text-xl font-extrabold text-orange">${plan.price.toLocaleString('es-AR')}</p><p className="mt-4 min-h-10 text-xs leading-5 text-ink/65">{plan.description}</p><div className="mt-5 space-y-3 border-t border-forest/10 pt-5">{plan.examples.map((example,index)=><p key={example} className="flex gap-2 text-xs leading-5 text-forest"><b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest text-[9px] text-white">{index+1}</b>{example}</p>)}</div></button>})}</div>
   <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-[1.75rem] bg-forest p-6 text-cream sm:flex-row sm:items-center"><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-orange"><SparklesIcon className="h-6"/></span><div><p className="text-xs font-bold uppercase tracking-widest text-orange">Tu elección</p><h3 className="mt-1 text-xl font-extrabold">Menú {selected}</h3>{confirmed&&<p className="mt-1 text-xs text-cream/65">Selección demo guardada.</p>}</div></div><button onClick={()=>setConfirmed(true)} className="rounded-full bg-orange px-6 py-3 text-sm font-extrabold text-white hover:bg-cream hover:text-forest">{confirmed?'Menú seleccionado':'Continuar con este menú'}</button></div>
   <div className="mt-14"><h3 className="font-display text-3xl text-forest">También podés sumar</h3><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{extras.map(extra=><article key={extra.title} className="rounded-2xl bg-white p-5 shadow-soft"><h4 className="text-lg font-extrabold uppercase text-forest">{extra.title}</h4><ul className="mt-4 space-y-3 text-xs leading-5 text-ink/65">{extra.items.map(item=><li key={item} className="border-l-2 border-orange pl-3">{item}</li>)}</ul></article>)}</div></div>
  </div>
 </section>
}
