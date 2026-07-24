'use client'
import { DependencyList, useCallback, useEffect, useState } from 'react'
import { ApiResponse } from '@/types/api'

export interface AsyncDataState<T> { data:T|null; loading:boolean; error:string|null; retry:()=>void }

export function useAsyncData<T>(loader:()=>Promise<ApiResponse<T>>,dependencies:DependencyList=[]):AsyncDataState<T>{
  const [data,setData]=useState<T|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [attempt,setAttempt]=useState(0)
  const load=useCallback(async()=>{setLoading(true);setError(null);try{const response=await loader();setData(response.data)}catch(cause){setData(null);setError(cause instanceof Error?cause.message:'Ocurrió un error inesperado.')}finally{setLoading(false)}},dependencies)
  useEffect(()=>{void load()},[load,attempt])
  return {data,loading,error,retry:()=>setAttempt(value=>value+1)}
}
