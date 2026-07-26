import { mockStoreConfig } from '@/mocks/commerce'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { apiEndpoints, appConfig } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'

export const storeConfigService={
 async get(){
  if(appConfig.dataSource==='mock'||!apiEndpoints.storeConfig)return mockResponse(mockStoreConfig)
  const response=await apiRequest<Record<string,unknown>>(requireEndpoint(apiEndpoints.storeConfig,'configuración del comercio'))
  return{...response,data:backofficeAdapter.storeConfig(response.data)}
 },
}
