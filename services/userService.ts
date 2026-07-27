import { mockUsers } from '@/mocks/commerce'
import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { NotFoundError } from '@/types/api'
import { backofficeAdapter } from '@/adapters/backofficeAdapter'
import { UpdateProfileInput } from '@/types/auth'

export const userService = {
  async getById(id: string) {
    if (useApiFor(apiEndpoints.customerMe)) {
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.customerMe)
      return { ...response, data: backofficeAdapter.user(response.data) }
    }
    const user = mockUsers.find(item => item.id === id)
    if (!user) throw new NotFoundError('Usuario', id)
    return mockResponse(user)
  },

  async update(id: string, input: UpdateProfileInput) {
    if (useApiFor(apiEndpoints.customerMe)) {
      const response = await apiRequest<Record<string, unknown>>(apiEndpoints.customerMe, {
        method: 'PATCH',
        // Se envían ambas formas: el backoffice actual guarda un único `fullName`.
        body: JSON.stringify({
          fullName: `${input.firstName} ${input.lastName}`.trim(),
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        }),
      })
      return { ...response, data: backofficeAdapter.user(response.data) }
    }
    const user = mockUsers.find(item => item.id === id)
    if (!user) throw new NotFoundError('Usuario', id)
    Object.assign(user, input)
    return mockResponse(user)
  },
}
