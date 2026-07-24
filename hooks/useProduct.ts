'use client'
import { useCallback } from 'react'
import { productService } from '@/services'
import { useAsyncData } from './useAsyncData'
export function useProduct(slug:string){const loader=useCallback(()=>productService.getBySlug(slug),[slug]);return useAsyncData(loader,[loader])}
