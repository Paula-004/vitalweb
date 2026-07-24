import { appConfig } from './config'
import { ApiResponse } from '@/types/api'

export async function mockResponse<T>(data: T): Promise<ApiResponse<T>> {
  await new Promise(resolve => setTimeout(resolve, appConfig.mockLatencyMs))
  return { data: structuredClone(data), meta: { requestId: `mock-${crypto.randomUUID()}`, timestamp: new Date().toISOString() } }
}
