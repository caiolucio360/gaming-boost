'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, CheckCircle, CreditCard, Info, MessageSquare, Shield } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type NotificationType = 
  | 'ORDER_UPDATE'
  | 'PAYMENT'
  | 'SYSTEM'
  | 'CHAT'
  | 'BOOSTER_ASSIGNED'
  | 'COMMISSION'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  link?: string | null
  read: boolean
  createdAt: string | Date
}

interface NotificationItemProps {
  notification: Notification
  onRead?: (id: number) => void
  compact?: boolean
}

export function NotificationItem({ notification, onRead, compact = false }: NotificationItemProps) {
  const Icon = getIcon(notification.type)
  
  const content = (
    <div 
      className={cn(
        "flex gap-3 p-4 relative group cursor-pointer",
        "transition-all duration-300 ease-in-out",
        notification.read 
          ? "bg-transparent hover:bg-purple-500/5" 
          : "bg-gradient-to-r from-purple-500/15 to-purple-500/5 border-l-4 border-purple-500 hover:from-purple-500/20 hover:to-purple-500/10 hover:shadow-[0_0_15px_rgba(124,58,237,0.3)]",
        compact ? "text-sm p-3" : ""
      )}
      onClick={() => !notification.read && onRead?.(notification.id)}
    >
      <div className={cn(
        "mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0",
        getIconColor(notification.type)
      )}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p className={cn("font-medium leading-none", notification.read ? "text-foreground" : "text-foreground font-semibold")}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {notification.message}
        </p>
      </div>
      
      {!notification.read && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
      )}
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={() => !notification.read && onRead?.(notification.id)}>
        {content}
      </Link>
    )
  }

  return content
}

function getIcon(type: NotificationType) {
  switch (type) {
    case 'ORDER_UPDATE': return CheckCircle
    case 'PAYMENT': return CreditCard
    case 'SYSTEM': return Info
    case 'CHAT': return MessageSquare
    case 'BOOSTER_ASSIGNED': return Shield
    case 'COMMISSION': return CreditCard
    default: return Bell
  }
}

function getIconColor(type: NotificationType) {
  switch (type) {
    case 'ORDER_UPDATE': return "bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30"
    case 'PAYMENT': return "bg-brand-purple-light/20 text-brand-purple-lighter border border-brand-purple-light/30"
    case 'SYSTEM': return "bg-brand-gray-800/50 text-brand-gray-400 border border-brand-gray-700"
    case 'CHAT': return "bg-brand-purple-lighter/20 text-brand-purple-lighter border border-brand-purple-lighter/30"
    case 'BOOSTER_ASSIGNED': return "bg-brand-purple-dark/30 text-brand-purple border border-brand-purple-dark/50"
    case 'COMMISSION': return "bg-brand-red/20 text-brand-red-light border border-brand-red/30"
    default: return "bg-brand-gray-800/50 text-brand-gray-400 border border-brand-gray-700"
  }
}
