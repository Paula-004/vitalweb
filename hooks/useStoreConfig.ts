'use client'
import { useCallback } from 'react'
import { storeConfigService } from '@/services'
import { useAsyncData } from './useAsyncData'
export function useStoreConfig(){const loader=useCallback(()=>storeConfigService.get(),[]);return useAsyncData(loader,[loader])}
