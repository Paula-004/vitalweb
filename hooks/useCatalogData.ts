'use client'
import { useCallback } from 'react'
import { categoryService, menuService, productService, promotionService } from '@/services'
import { ApiResponse } from '@/types/api'
import { Category, DailyMenu, Product, Promotion } from '@/types/domain'
import { useAsyncData } from './useAsyncData'
export interface CatalogData{products:Product[];categories:Category[];dailyMenus:DailyMenu[];promotions:Promotion[]}
export function useCatalogData(){const loader=useCallback(async():Promise<ApiResponse<CatalogData>>=>{const[products,categories,dailyMenus,promotions]=await Promise.all([productService.getAll(),categoryService.getAll(),menuService.getDailyMenus(),promotionService.getAll()]);return{data:{products:products.data,categories:categories.data,dailyMenus:dailyMenus.data,promotions:promotions.data},meta:products.meta}},[]);return useAsyncData(loader,[loader])}
