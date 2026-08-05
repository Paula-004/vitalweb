import PaymentResult from '@/components/PaymentResult'
import { PaymentStatus } from '@/types/domain'

export default function Page({ searchParams }: { searchParams: { status?: string; order?: string; payment?: string } }) {
  const status = (['approved', 'pending', 'rejected', 'cancelled'].includes(searchParams.status ?? '') ? searchParams.status : 'cancelled') as PaymentStatus
  return <PaymentResult initialStatus={status} orderId={searchParams.order} paymentId={searchParams.payment} />
}
