'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, AlertCircle } from 'lucide-react'
import { showError } from '@/lib/toast'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { formatDate } from '@/lib/utils'

interface DisputeMessage {
  id: number
  content: string
  authorId: number
  author: {
    id: number
    name: string | null
    image: string | null
  }
  createdAt: string
}

interface Dispute {
  id: number
  orderId: number
  reason: string
  status: string
  createdAt: string
  creator: {
    id: number
    name: string | null
    image: string | null
  }
  order: {
    id: number
    total: number
    status: string
    user: { id: number; name: string | null; image: string | null }
    booster: { id: number; name: string | null; image: string | null } | null
  }
  messages: DisputeMessage[]
}

interface DisputeChatProps {
  disputeId: number
}

export function DisputeChat({ disputeId }: DisputeChatProps) {
  const { user } = useAuth()
  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchDispute = async () => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}`)
      if (response.ok) {
        const data = await response.json()
        setDispute(data.dispute)
      }
    } catch (error) {
      console.error('Erro ao buscar disputa:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispute()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchDispute, 5000)
    return () => clearInterval(interval)
  }, [disputeId])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [dispute?.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao enviar mensagem')
      }

      setMessage('')
      await fetchDispute() // Refresh to get new message
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!dispute) {
    return (
      <Card className="bg-black/30 backdrop-blur-md border-red-500/50">
        <CardContent className="pt-6">
          <p className="text-center text-gray-400">Disputa não encontrada</p>
        </CardContent>
      </Card>
    )
  }

  const isResolved = dispute.status !== 'OPEN'

  return (
    <div className="space-y-4">
      {/* Dispute Info */}
      <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-white font-orbitron flex items-center justify-between">
            <span>Disputa #{dispute.id}</span>
            <span className={`text-sm px-3 py-1 rounded-full ${
              isResolved 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-yellow-500/20 text-yellow-300'
            }`}>
              {dispute.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-gray-400 font-rajdhani">Pedido</p>
            <p className="text-white">#{dispute.orderId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-rajdhani">Motivo</p>
            <p className="text-white">{dispute.reason}</p>
          </div>
          <div className="text-xs text-gray-500">
            Criada em {formatDate(dispute.createdAt)}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-white font-orbitron">Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {dispute.messages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma mensagem ainda</p>
              ) : (
                dispute.messages.map((msg) => {
                  const isOwnMessage = msg.authorId === user?.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-8 w-8 border border-purple-500/30">
                        <AvatarImage src={msg.author.image || ''} />
                        <AvatarFallback className="bg-purple-900/50 text-purple-200 text-xs">
                          {msg.author.name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-white">
                            {msg.author.name || 'Usuário'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                        <div className={`rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-purple-600/30 border border-purple-500/30'
                            : 'bg-gray-800/50 border border-gray-700/30'
                        }`}>
                          <p className="text-white text-sm">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          {!isResolved ? (
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="bg-black/50 border-purple-500/30 text-white"
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={sending || !message.trim()}
                className="bg-purple-600 border border-transparent hover:border-white/50"
              >
                {sending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          ) : (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Esta disputa foi resolvida e não aceita mais mensagens.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
