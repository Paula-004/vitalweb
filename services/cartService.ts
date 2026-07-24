import { Cart, Product } from '@/types/domain'
const KEY='vitalweb-demo-cart'
const empty:Cart={items:[],generalNotes:''}
export const cartService={
 load():Cart{if(typeof window==='undefined')return empty;try{return JSON.parse(localStorage.getItem(KEY)??'null')??empty}catch{return empty}},
 save(cart:Cart){if(typeof window!=='undefined')localStorage.setItem(KEY,JSON.stringify(cart))},
 clear(){if(typeof window!=='undefined')localStorage.removeItem(KEY)},
 validate(cart:Cart,products:Product[],minimumOrder:number){const issues:string[]=[];if(!cart.items.length)issues.push('El carrito está vacío.');for(const item of cart.items){const product=products.find(value=>value.id===item.productId);if(!product||!product.active)issues.push('Uno de los productos ya no existe.');else if(!product.available||!product.availableDays.includes('martes'))issues.push(`${product.name} no está disponible para la fecha seleccionada.`);else if(product.stock===0)issues.push(`${product.name} está agotado.`);else if(item.quantity>product.stock)issues.push(`Sólo quedan ${product.stock} unidades de ${product.name}.`)}const subtotal=cart.items.reduce((sum,item)=>{const product=products.find(value=>value.id===item.productId);return sum+(product?.promotionalPrice??product?.price??0)*item.quantity},0);if(subtotal<minimumOrder&&cart.items.length)issues.push(`El monto mínimo es $${minimumOrder.toLocaleString('es-AR')}.`);return issues},
}
