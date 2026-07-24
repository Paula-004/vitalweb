'use client'
import { useCallback } from 'react'
import { categoryService, menuService, productService, shippingService, storeConfigService } from '@/services'
import { ApiResponse } from '@/types/api'
import { Category, DailyMenu, Product, StoreConfig, TimeSlot } from '@/types/domain'
import { useAsyncData } from './useAsyncData'

export interface StorefrontData { products:Product[]; categories:Category[]; dailyMenu:DailyMenu; storeConfig:StoreConfig; timeSlots:TimeSlot[] }

export function useStorefrontData(){
  const loader=useCallback(async():Promise<ApiResponse<StorefrontData>>=>{
    const [products,categories,dailyMenu,storeConfig,timeSlots]=await Promise.all([productService.getAll(),categoryService.getAll(),menuService.getDailyMenu(),storeConfigService.get(),shippingService.getTimeSlots()])
    const menuIds=new Set(dailyMenu.data.items.map(item=>item.productId))
    return { data:{products:products.data.filter(product=>menuIds.has(product.id)),categories:categories.data,dailyMenu:dailyMenu.data,storeConfig:storeConfig.data,timeSlots:timeSlots.data}, meta:{requestId:products.meta.requestId,timestamp:new Date().toISOString()} }
  },[])
  return useAsyncData(loader,[loader])
}
