'use client'

import { useCallback, useEffect, useState } from 'react'
import { NotificationItem, Notification } from '@/components/common/notification-item'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLoading } from '@/hooks/use-loading'
import { Loader2, CheckCheck } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 20

  const fetchNotifications = useCallback(
    (offset: number, append = false) =>
      withLoading(async () => {
        try {
          const res = await fetch(`/api/notifications?limit=${LIMIT}&offset=${offset}`)
          if (res.ok) {
            const data = await res.json()
            if (append) {
              setNotifications(prev => [...prev, ...data.notifications])
            } else {
              setNotifications(data.notifications)
            }
            setHasMore(data.pagination.hasMore)
          }
        } catch (error) {
          console.error('Failed to fetch notifications', error)
        }
      }),
    [withLoading]
  )

  useEffect(() => {
    fetchNotifications(0)
  }, [fetchNotifications])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchNotifications(nextPage * LIMIT, true)
  }

  const markAsRead = async (id: number) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
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
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
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
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-brand-purple-light mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>Notificações</h1>
          <p className="text-brand-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Acompanhe atualizações dos seus pedidos e mensagens do sistema.</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} className="border-brand-purple/50 text-brand-purple-light hover:border-white/50 transition-all duration-300">
          <CheckCheck className="mr-2 h-4 w-4" />
          Marcar tudo como lido
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 && !loading ? (
          <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light transition-all hover-glow">
            <CardContent className="flex flex-col items-center justify-center py-12 text-brand-gray-400">
              <p className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Você não tem notificações.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light transition-all hover-glow overflow-hidden p-0">
              <NotificationItem 
                notification={notification} 
                onRead={markAsRead}
              />
            </Card>
          ))
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
          </div>
        )}

        {!loading && hasMore && (
          <div className="flex justify-center pt-4">
            <Button variant="ghost" onClick={loadMore} className="text-brand-purple-light border border-transparent hover:border-brand-purple-light/50 transition-all duration-300">
              Carregar mais
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
