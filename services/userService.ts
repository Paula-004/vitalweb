import { mockUsers } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { User } from '@/types/domain'
import { UpdateProfileInput } from '@/types/auth'

export const userService = {
 async getById(id:string) { if(appConfig.dataSource==='api') return apiRequest<User>(apiEndpoints.customerMe); const user=mockUsers.find(u=>u.id===id); if(!user) throw new NotFoundError('Usuario',id); return mockResponse(user) },
 async update(id:string,input:UpdateProfileInput){if(appConfig.dataSource==='api')return apiRequest<User>(apiEndpoints.customerMe,{method:'PATCH',body:JSON.stringify({fullName:`${input.firstName} ${input.lastName}`.trim(),phone:input.phone})});const user=mockUsers.find(item=>item.id===id);if(!user)throw new NotFoundError('Usuario',id);Object.assign(user,input);return mockResponse(user)}
}
