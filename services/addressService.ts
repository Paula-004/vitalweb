import { mockUsers } from '@/mocks/commerce'
import { appConfig } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { DataSourceError, NotFoundError } from '@/types/api'
import { Address } from '@/types/domain'
export type AddressInput=Omit<Address,'id'>
export const addressService={
 async getAll(userId:string){if(appConfig.dataSource==='api')throw new DataSourceError('Falta configurar el endpoint real de direcciones.');const user=mockUsers.find(item=>item.id===userId);if(!user)throw new NotFoundError('Usuario',userId);return mockResponse(user.addresses)},
 async create(userId:string,input:AddressInput){if(appConfig.dataSource==='api')throw new DataSourceError('Falta configurar el endpoint real de direcciones.');const user=mockUsers.find(item=>item.id===userId);if(!user)throw new NotFoundError('Usuario',userId);if(input.isDefault)user.addresses.forEach(item=>item.isDefault=false);const address={...input,id:`addr-mock-${Date.now()}`};user.addresses.push(address);return mockResponse(address)},
 async remove(userId:string,addressId:string){if(appConfig.dataSource==='api')throw new DataSourceError('Falta configurar el endpoint real de direcciones.');const user=mockUsers.find(item=>item.id===userId);if(!user)throw new NotFoundError('Usuario',userId);user.addresses=user.addresses.filter(item=>item.id!==addressId);return mockResponse({success:true})},
}
