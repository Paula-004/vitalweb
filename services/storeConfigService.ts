import { mockStoreConfig } from '@/mocks/commerce'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { StoreConfig } from '@/types/domain'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
export const storeConfigService = { async get() { if(appConfig.dataSource==='mock')return mockResponse(mockStoreConfig);const response=await apiRequest<Record<string,unknown>>(requireEndpoint(apiEndpoints.storeConfig,'configuración del comercio'));return{...response,data:backofficeAdapter.storeConfig(response.data)} } }
