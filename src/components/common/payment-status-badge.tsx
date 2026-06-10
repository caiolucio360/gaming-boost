import { Badge } from '@/components/ui/badge'

export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED'

const configs: Record<PaymentStatus, { label: string; className: string }> = {
  PAID: { label: 'Pago', className: 'bg-green-500/20 text-green-300 border-green-500/50' },
  PENDING: { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-500/20 text-red-300 border-red-500/50' },
}

/**
 * Status badge for financial records (commissions, revenues, withdrawals) —
 * distinct from order `StatusBadge`, which carries order-specific semantics
 * (tooltips + the "Aguardando Booster" badge).
 */
export function PaymentStatusBadge({ status }: { status: string }) {
  const config = configs[status as PaymentStatus]
  if (!config) return <Badge>{status}</Badge>
  return <Badge className={config.className}>{config.label}</Badge>
}
