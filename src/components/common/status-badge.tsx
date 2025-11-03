import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle2, XCircle, Loader2, LucideIcon } from 'lucide-react'

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface StatusConfig {
  label: string
  color: string
  icon: LucideIcon
}

const statusConfigs: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'Em Progresso',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    icon: Loader2,
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-green-500/20 text-green-300 border-green-500/50',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-500/20 text-red-300 border-red-500/50',
    icon: XCircle,
  },
}

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfigs[status]
  const Icon = config.icon

  return (
    <Badge
      className={`${config.color} border font-rajdhani flex items-center gap-2 ${className || ''}`}
      style={{ fontFamily: 'Rajdhani, sans-serif' }}
    >
      <Icon className="h-4 w-4" />
      {config.label}
    </Badge>
  )
}

