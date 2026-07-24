import { mockPaymentMethods } from '@/mocks/commerce'
import { apiRequest, requireEndpoint } from '@/lib/apiClient'
import { appConfig, apiEndpoints } from '@/lib/config'
import { mockResponse } from '@/lib/mockApi'
import { PaymentMethod, PaymentStatus, PaymentTransaction } from '@/types/domain'
export const paymentService={
 async getAll(){return appConfig.dataSource==='mock'?mockResponse(mockPaymentMethods.filter(item=>item.active)):apiRequest<PaymentMethod[]>(requireEndpoint(apiEndpoints.paymentMethods,'medios de pago'))},
 async simulate(input:{orderId:string;methodId:string;amount:number;status:PaymentStatus}){if(appConfig.dataSource==='api')return apiRequest<PaymentTransaction>(requireEndpoint(apiEndpoints.paymentMethods,'procesamiento de pago'),{method:'POST',body:JSON.stringify(input)});return mockResponse<PaymentTransaction>({id:`payment-demo-${Date.now()}`,orderId:input.orderId,methodId:input.methodId,amount:input.amount,currency:'ARS',status:input.status,createdAt:new Date().toISOString(),isSimulation:true})},
}
