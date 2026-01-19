'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, AlertCircle, MessageCircle, Users, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
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
    role?: string
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchDispute = async () => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}`)
      if (response.ok) {
        const data = await response.json()
        setDispute(data.dispute)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Erro ao buscar disputa:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispute()
    // Poll for new messages every 3 seconds (faster for better real-time feel)
    const interval = setInterval(fetchDispute, 3000)
    return () => clearInterval(interval)
  }, [disputeId])

  useEffect(() => {
    // Smooth scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      await fetchDispute()
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { label: 'Aberta', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', icon: Clock }
      case 'RESOLVED':
        return { label: 'Resolvida', color: 'bg-green-500/20 text-green-300 border-green-500/50', icon: CheckCircle2 }
      case 'CLOSED':
        return { label: 'Fechada', color: 'bg-gray-500/20 text-gray-300 border-gray-500/50', icon: XCircle }
      default:
        return { label: status, color: 'bg-purple-500/20 text-purple-300 border-purple-500/50', icon: AlertCircle }
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!dispute) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-red-500/30">
        <CardContent className="pt-6 text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Disputa não encontrada
          </p>
        </CardContent>
      </Card>
    )
  }

  const isResolved = dispute.status !== 'OPEN'
  const statusConfig = getStatusConfig(dispute.status)
  const StatusIcon = statusConfig.icon

  // Get participants
  const participants = [
    { ...dispute.order.user, role: 'Cliente' },
    ...(dispute.order.booster ? [{ ...dispute.order.booster, role: 'Booster' }] : []),
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Dispute Info */}
      <div className="lg:col-span-1 space-y-4">
        {/* Status Card */}
        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-purple-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <MessageCircle className="h-5 w-5 text-purple-400" />
              Disputa #{dispute.id}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge className={`${statusConfig.color} border font-rajdhani flex items-center gap-1 w-fit`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Pedido</p>
              <p className="text-white font-medium">#{dispute.orderId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Motivo</p>
              <p className="text-gray-300 text-sm">{dispute.reason}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Criada em</p>
              <p className="text-gray-400 text-sm">{formatDate(dispute.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Participants Card */}
        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-purple-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <Users className="h-5 w-5 text-purple-400" />
              Participantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {participants.map((participant, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-purple-500/30">
                  <AvatarImage src={participant.image || ''} />
                  <AvatarFallback className="bg-purple-900/50 text-purple-200 text-xs">
                    {participant.name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-sm font-medium">{participant.name || 'Usuário'}</p>
                  <p className="text-gray-500 text-xs">{participant.role}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live Update Indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Atualizando automaticamente</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-3">
        <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-purple-500/30 h-[600px] flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b border-purple-500/20 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <MessageCircle className="h-5 w-5 text-purple-400" />
                Chat da Disputa
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <RefreshCw className="h-3 w-3" />
                <span>Atualizado {formatMessageTime(lastUpdate.toISOString())}</span>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4" ref={scrollRef}>
              <div className="space-y-4 pb-4">
                {dispute.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                      <MessageCircle className="h-8 w-8 text-purple-400" />
                    </div>
                    <p className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Nenhuma mensagem ainda
                    </p>
                    <p className="text-gray-600 text-sm">
                      Inicie a conversa para resolver esta disputa
                    </p>
                  </div>
                ) : (
                  dispute.messages.map((msg, idx) => {
                    const isOwnMessage = msg.authorId === user?.id
                    const showAvatar = idx === 0 || dispute.messages[idx - 1].authorId !== msg.authorId
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                      >
                        {showAvatar ? (
                          <Avatar className="h-9 w-9 border-2 border-purple-500/30 flex-shrink-0">
                            <AvatarImage src={msg.author.image || ''} />
                            <AvatarFallback className="bg-purple-900/50 text-purple-200 text-xs">
                              {msg.author.name?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-9 flex-shrink-0" />
                        )}
                        <div className={`flex-1 max-w-[75%] ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                          {showAvatar && (
                            <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                              <p className="text-sm font-semibold text-white">
                                {msg.author.name || 'Usuário'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatMessageTime(msg.createdAt)}
                              </p>
                            </div>
                          )}
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                              : 'bg-gray-800/80 border border-gray-700/50 text-gray-100'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                          {!showAvatar && (
                            <p className={`text-xs text-gray-600 mt-1 ${isOwnMessage ? 'text-right' : ''}`}>
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="p-4 border-t border-purple-500/20 flex-shrink-0">
            {!isResolved ? (
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-6"
                >
                  {sending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-blue-200 font-medium font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Disputa Resolvida
                  </p>
                  <p className="text-blue-300/70 text-sm">
                    Esta disputa foi encerrada e não aceita mais mensagens.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
