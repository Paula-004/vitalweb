import { mockUsers } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { DataSourceError } from '@/types/api'
import { AuthSession, LoginInput, RegisterInput } from '@/types/auth'

const DEMO_PASSWORD='vital123'
const SESSION_KEY='vitalweb-demo-session'
const session=(user:typeof mockUsers[number]):AuthSession=>({user:structuredClone(user),accessToken:`mock-token-${user.id}`,expiresAt:new Date(Date.now()+8*60*60*1000).toISOString(),isMock:true})
export const authService={
 loadSession():AuthSession|null{if(typeof window==='undefined')return null;try{const saved=JSON.parse(localStorage.getItem(SESSION_KEY)??'null') as AuthSession|null;if(!saved)return null;if(new Date(saved.expiresAt).getTime()<=Date.now()){localStorage.removeItem(SESSION_KEY);return null}return saved}catch{return null}},
 saveSession(value:AuthSession){if(typeof window!=='undefined')localStorage.setItem(SESSION_KEY,JSON.stringify(value))},
 clearSession(){if(typeof window!=='undefined')localStorage.removeItem(SESSION_KEY)},
 async login(input:LoginInput){if(appConfig.dataSource==='api')return apiRequest<AuthSession>(apiEndpoints.customerLogin,{method:'POST',body:JSON.stringify(input)});const user=mockUsers.find(item=>item.email.toLowerCase()===input.email.toLowerCase());if(!user||input.password!==DEMO_PASSWORD)throw new DataSourceError('Correo o contraseña incorrectos.',401);return mockResponse(session(user))},
 async register(input:RegisterInput){if(appConfig.dataSource==='api')return apiRequest<AuthSession>(apiEndpoints.customerRegister,{method:'POST',body:JSON.stringify({fullName:`${input.firstName} ${input.lastName}`.trim(),email:input.email,phone:input.phone,password:input.password})});if(mockUsers.some(user=>user.email.toLowerCase()===input.email.toLowerCase()))throw new DataSourceError('Ya existe una cuenta con ese correo.',409);const user={id:`user-mock-${Date.now()}`,firstName:input.firstName,lastName:input.lastName,email:input.email,phone:input.phone,addresses:[],createdAt:new Date().toISOString()};mockUsers.push(user);return mockResponse(session(user))},
 async recoverPassword(email:string){if(appConfig.dataSource==='api')throw new DataSourceError('La recuperación de contraseña todavía no está configurada.');if(!mockUsers.some(user=>user.email.toLowerCase()===email.toLowerCase()))throw new DataSourceError('No encontramos una cuenta con ese correo.',404);return mockResponse({sent:true})},
 async logout(){this.clearSession();return mockResponse({success:true})},
}
