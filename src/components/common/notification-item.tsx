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
        "flex gap-3 p-3 rounded-lg transition-colors relative group",
        notification.read ? "bg-background hover:bg-muted/50" : "bg-muted/30 hover:bg-muted/60 border-l-2 border-primary",
        compact ? "text-sm" : ""
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
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
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
    case 'ORDER_UPDATE': return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
    case 'PAYMENT': return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    case 'SYSTEM': return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    case 'CHAT': return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
    case 'BOOSTER_ASSIGNED': return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    case 'COMMISSION': return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
  }
}
