'use client'
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { cartService, productService } from '@/services'
import { Cart, Product } from '@/types/domain'
type Value={cart:Cart;products:Product[];ready:boolean;count:number;subtotal:number;discount:number;add:(product:Product,quantity?:number,notes?:string)=>void;updateQuantity:(id:string,quantity:number)=>void;remove:(id:string)=>void;setItemNotes:(id:string,notes:string)=>void;setGeneralNotes:(notes:string)=>void;setCoupon:(code?:string)=>void;clear:()=>void}
const Context=createContext<Value|null>(null)
export function CartProvider({children}:{children:ReactNode}){
 const[cart,setCart]=useState<Cart>({items:[],generalNotes:''}),[products,setProducts]=useState<Product[]>([]),[ready,setReady]=useState(false)
 useEffect(()=>{setCart(cartService.load());productService.getAll().then(response=>setProducts(response.data)).finally(()=>setReady(true))},[])
 useEffect(()=>{if(ready)cartService.save(cart)},[cart,ready])
 const add=(product:Product,quantity=1,notes='')=>{if(!product.available||product.stock<1)throw new Error('Este producto no está disponible.');setCart(current=>{const existing=current.items.find(item=>item.productId===product.id),next=Math.min(product.stock,(existing?.quantity??0)+quantity);return{...current,items:existing?current.items.map(item=>item.productId===product.id?{...item,quantity:next,notes:notes||item.notes}:item):[...current.items,{productId:product.id,quantity:Math.min(quantity,product.stock),notes}]}})}
 const updateQuantity=(id:string,quantity:number)=>setCart(current=>{const product=products.find(item=>item.id===id);if(quantity<=0)return{...current,items:current.items.filter(item=>item.productId!==id)};return{...current,items:current.items.map(item=>item.productId===id?{...item,quantity:Math.min(quantity,product?.stock??quantity)}:item)}})
 const remove=(id:string)=>setCart(current=>({...current,items:current.items.filter(item=>item.productId!==id)}))
 const setItemNotes=(id:string,notes:string)=>setCart(current=>({...current,items:current.items.map(item=>item.productId===id?{...item,notes}:item)}))
 const setGeneralNotes=(generalNotes:string)=>setCart(current=>({...current,generalNotes}))
 const setCoupon=(couponCode?:string)=>setCart(current=>({...current,couponCode}))
 const clear=()=>{setCart({items:[],generalNotes:''});cartService.clear()}
 const count=cart.items.reduce((sum,item)=>sum+item.quantity,0)
 const subtotal=cart.items.reduce((sum,item)=>{const product=products.find(value=>value.id===item.productId);return sum+(product?.promotionalPrice??product?.price??0)*item.quantity},0)
 const discount=cart.items.reduce((sum,item)=>{const product=products.find(value=>value.id===item.productId);return sum+(product?.promotionalPrice?product.price-product.promotionalPrice:0)*item.quantity},0)
 const value=useMemo(()=>({cart,products,ready,count,subtotal,discount,add,updateQuantity,remove,setItemNotes,setGeneralNotes,setCoupon,clear}),[cart,products,ready,count,subtotal,discount])
 return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useCart(){const value=useContext(Context);if(!value)throw new Error('useCart debe usarse dentro de CartProvider.');return value}
