import { mockProducts } from '@/mocks/catalog'
import { mockResponse } from '@/lib/mockApi'
export const recommendationService={
 async getFeatured(){return mockResponse(mockProducts.filter(item=>item.active&&item.featured).slice(0,4))},
 async getBestSellers(){return mockResponse(mockProducts.filter(item=>item.active&&item.bestSeller).slice(0,4))},
 async getPromotions(){return mockResponse(mockProducts.filter(item=>item.active&&item.promotionalPrice).slice(0,4))},
 async getForProduct(productId:string){const current=mockProducts.find(item=>item.id===productId);return mockResponse(mockProducts.filter(item=>item.active&&item.id!==productId&&(item.categoryId===current?.categoryId||item.featured)).slice(0,4))},
 async getSides(){return mockResponse(mockProducts.filter(item=>item.categoryId==='cat-acompanamientos'||item.categoryId==='cat-bebidas').slice(0,4))},
 async getFrequentlyBoughtTogether(productId:string){const ids=productId.includes('pollo')?['prod-pollo-portuguesa','prod-vegetales-horno','prod-limonada-menta']:['prod-power-salad','prod-limonada-menta','prod-cheesecake-keto'];return mockResponse(mockProducts.filter(item=>ids.includes(item.id)))},
}
