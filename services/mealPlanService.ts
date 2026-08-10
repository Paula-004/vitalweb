import { apiRequest } from '@/lib/apiClient'
import { apiEndpoints, useApiFor } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { MealBalanceSummary } from '@/types/domain'

export const mealPlanService = {
  async getMyBalance() {
    if (!useApiFor(apiEndpoints.mealBalance)) {
      return mockResponse<MealBalanceSummary>({ totalRemaining: 0, balances: [] })
    }
    return apiRequest<MealBalanceSummary>(apiEndpoints.mealBalance)
  },
}
