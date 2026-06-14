import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, CheckCircle2, XCircle, Loader2, LucideIcon, CreditCard, Hourglass } from 'lucide-react'

export type OrderStatus = 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface StatusConfig {
  label: string
  color: string
  icon: LucideIcon
}

const statusConfigs: Record<OrderStatus, StatusConfig & { tooltip: string }> = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-yellow-500/20 text-foreground dark:text-yellow-300 border-yellow-500/50',
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
    color: 'bg-blue-500/20 text-foreground dark:text-blue-300 border-blue-500/50',
    icon: Loader2,
    tooltip: 'Pedido sendo executado no momento',
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-green-500/20 text-foreground dark:text-green-300 border-green-500/50',
    icon: CheckCircle2,
    tooltip: 'Pedido finalizado com sucesso',
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-500/20 text-foreground dark:text-red-300 border-red-500/50',
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
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={`${config.color} border font-rajdhani flex items-center gap-2 shadow-lg hover:scale-105 transition-transform duration-300 cursor-help`}
            >
              <Icon className={`h-4 w-4 ${status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-popover border-brand-purple/50 text-popover-foreground">
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {status === 'PAID' && (
        <Badge
          className="bg-orange-500/20 text-foreground dark:text-orange-300 border border-orange-500/50 font-rajdhani flex items-center gap-2 animate-pulse"
        >
          <Hourglass className="h-3 w-3" />
          Aguardando Booster
        </Badge>
      )}
    </div>
  )
}

