import { mockUsers } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { Address } from '@/types/domain'

export type AddressInput = Omit<Address, 'id'>

const findUser = (userId: string) => {
  const user = mockUsers.find(item => item.id === userId)
  if (!user) throw new NotFoundError('Usuario', userId)
  return user
}

export const addressService = {
  async getAll(userId: string) {
    if (useApiFor(apiEndpoints.addresses)) {
      const response = await apiRequest<unknown>(apiEndpoints.addresses)
      return { ...response, data: backofficeAdapter.list(response.data, backofficeAdapter.address) }
    }
    return mockResponse(findUser(userId).addresses)
  },

  async create(userId: string, input: AddressInput) {
    if (useApiFor(apiEndpoints.addresses)) {
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.addresses, { method: 'POST', body: JSON.stringify(input) })
      return { ...response, data: backofficeAdapter.address(response.data) }
    }
    const user = findUser(userId)
    if (input.isDefault) user.addresses.forEach(item => { item.isDefault = false })
    const address: Address = { ...input, id: `addr-mock-${Date.now()}` }
    user.addresses.push(address)
    return mockResponse(address)
  },

  async update(userId: string, addressId: string, input: Partial<AddressInput>) {
    if (useApiFor(apiEndpoints.addresses)) {
      const response = await apiRequest<Record<string, unknown>>(`${apiEndpoints.addresses}/${addressId}`, { method: 'PATCH', body: JSON.stringify(input) })
      return { ...response, data: backofficeAdapter.address(response.data) }
    }
    const user = findUser(userId)
    const address = user.addresses.find(item => item.id === addressId)
    if (!address) throw new NotFoundError('Dirección', addressId)
    if (input.isDefault) user.addresses.forEach(item => { item.isDefault = false })
    Object.assign(address, input)
    return mockResponse(address)
  },

  async setDefault(userId: string, addressId: string) {
    return this.update(userId, addressId, { isDefault: true })
  },

  async remove(userId: string, addressId: string) {
    if (useApiFor(apiEndpoints.addresses)) {
      const response = await apiRequest<unknown>(`${apiEndpoints.addresses}/${addressId}`, { method: 'DELETE' })
      return { ...response, data: { success: true } }
    }
    const user = findUser(userId)
    user.addresses = user.addresses.filter(item => item.id !== addressId)
    return mockResponse({ success: true })
  },
}
