'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationItem, Notification } from './notification-item'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications?limit=5')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [pathname]) // Refetch when route changes

  // Realtime updates via SSE
  useEffect(() => {
    const eventSource = new EventSource('/api/realtime')

    eventSource.onmessage = (event) => {
      // Handle generic messages if needed
    }

    eventSource.addEventListener('notification', (event) => {
      try {
        const newNotification = JSON.parse(event.data)
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Optional: Play sound or show toast
      } catch (e) {
        console.error('Error parsing notification event', e)
      }
    })

    return () => {
      eventSource.close()
    }
  }, [])

  const markAsRead = async (id: number) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] })
      })
    } catch (error) {
      console.error('Failed to mark as read', error)
    }
  }

  const markAllRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
    } catch (error) {
      console.error('Failed to mark all as read', error)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white hover:text-purple-300 hover:bg-purple-500/10 transition-colors duration-300">
                <div className={`relative ${unreadCount > 0 ? 'animate-bellPulse' : ''}`}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span 
                      className={`absolute -top-2.5 -right-2.5 h-[18px] flex items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white text-[10px] font-bold leading-none ${unreadCount > 9 ? 'min-w-[22px] px-1.5' : 'min-w-[18px]'}`}
                      style={{ 
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="sr-only">Notificações</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
            <p>{unreadCount > 0 ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}` : 'Notificações'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80 p-0 bg-black/90 backdrop-blur-md border-purple-500/50 shadow-lg" align="end">
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <h4 className="font-semibold font-orbitron text-purple-400">Notificações</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto p-0 text-purple-300 hover:text-purple-200" onClick={markAllRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">Nenhuma notificação recente</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onRead={markAsRead}
                  compact
                />
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-purple-500/20 text-center">
          <Link 
            href="/notifications" 
            className="text-xs text-purple-300 hover:text-purple-200 block w-full py-2 transition-colors duration-300"
            onClick={() => setIsOpen(false)}
          >
            Ver todas as notificações
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
