import { mockUsers } from '@/mocks/commerce'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { User } from '@/types/domain'
import { UpdateProfileInput } from '@/types/auth'
export const userService = { async getById(id:string) { if(appConfig.dataSource==='api') return apiRequest<User>(`${requireEndpoint(apiEndpoints.users,'usuarios')}/${id}`); const user=mockUsers.find(u=>u.id===id); if(!user) throw new NotFoundError('Usuario',id); return mockResponse(user) }, async update(id:string,input:UpdateProfileInput){if(appConfig.dataSource==='api')return apiRequest<User>(requireEndpoint(apiEndpoints.users,'actualización de usuario'),{method:'PATCH',body:JSON.stringify(input)});const user=mockUsers.find(item=>item.id===id);if(!user)throw new NotFoundError('Usuario',id);Object.assign(user,input);return mockResponse(user)} }
