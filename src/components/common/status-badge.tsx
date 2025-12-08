import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, CheckCircle2, XCircle, Loader2, LucideIcon, CreditCard } from 'lucide-react'

export type OrderStatus = 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface StatusConfig {
  label: string
  color: string
  icon: LucideIcon
}

const statusConfigs: Record<OrderStatus, StatusConfig & { tooltip: string }> = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    icon: Clock,
    tooltip: 'Pedido aguardando pagamento',
  },
  PAID: {
    label: 'Pago',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    icon: CreditCard,
    tooltip: 'Pagamento confirmado, aguardando um booster aceitar',
  },
  IN_PROGRESS: {
    label: 'Em Progresso',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    icon: Loader2,
    tooltip: 'Pedido sendo executado no momento',
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-green-500/20 text-green-300 border-green-500/50',
    icon: CheckCircle2,
    tooltip: 'Pedido finalizado com sucesso',
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-500/20 text-red-300 border-red-500/50',
    icon: XCircle,
    tooltip: 'Pedido foi cancelado',
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`${config.color} border font-rajdhani flex items-center gap-2 shadow-lg hover:scale-105 transition-transform duration-300 cursor-help ${className || ''}`}
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <Icon className={`h-4 w-4 ${status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

