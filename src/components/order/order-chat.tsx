'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  MessageCircle,
  Lock,
  AlertCircle,
  RefreshCw,
  Shield,
} from 'lucide-react'
import { showError } from '@/lib/toast'
import { LoadingSpinner } from '@/components/common/loading-spinner'

interface ChatMessage {
  id: number
  content: string
  authorId: number
  author: {
    id: number
    name: string | null
    image: string | null
    role: string
  }
  createdAt: string
}

interface OrderChatData {
  id: number
  orderId: number
  isActive: boolean
  messages: ChatMessage[]
  order: {
    id: number
    status: string
    userId: number
    boosterId: number | null
  }
}

interface OrderChatProps {
  orderId: number
  className?: string
}

export function OrderChat({ orderId, className }: OrderChatProps) {
  const { user } = useAuth()
  const [chat, setChat] = useState<OrderChatData | null>(null)
  const [chatEnabled, setChatEnabled] = useState(false)
  const [disabledReason, setDisabledReason] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchChat = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/chat`)
      if (response.ok) {
        const data = await response.json()
        setChat(data.chat)
        setChatEnabled(data.chatEnabled)
        setDisabledReason(data.disabledReason)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Erro ao buscar chat:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchChat()
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchChat, 3000)
    return () => clearInterval(interval)
  }, [fetchChat])

  useEffect(() => {
    // Smooth scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao enviar mensagem')
      }

      setMessage('')
      await fetchChat()
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/50 text-xs ml-2">Admin</Badge>
      case 'BOOSTER':
        return <Badge className="bg-brand-purple/20 text-brand-purple-light border-brand-purple/50 text-xs ml-2">Booster</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-brand-purple/30 ${className || ''}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  const messages = chat?.messages || []
  const hasMessages = messages.length > 0

  return (
    <Card className={`bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-brand-purple/30 h-[500px] flex flex-col ${className || ''}`}>
      {/* Chat Header */}
      <CardHeader className="border-b border-brand-purple/20 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <MessageCircle className="h-5 w-5 text-brand-purple-light" />
            Chat do Pedido
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Lock className="h-3 w-3" />
              <span>Criptografado</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <RefreshCw className="h-3 w-3" />
              <span>{formatMessageTime(lastUpdate.toISOString())}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Security Notice */}
      <div className="px-4 py-2 bg-brand-purple/5 border-b border-brand-purple/20 flex-shrink-0">
        <div className="flex items-start gap-2 text-xs">
          <Shield className="h-4 w-4 text-brand-purple-light flex-shrink-0 mt-0.5" />
          <p className="text-gray-400">
            Suas mensagens são criptografadas com AES-256-GCM. Compartilhe suas credenciais Steam com segurança apenas com o booster designado.
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4 pb-4">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-purple/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-brand-purple-light" />
                </div>
                <p className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Nenhuma mensagem ainda
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {chatEnabled
                    ? 'Inicie a conversa com o booster'
                    : disabledReason || 'Chat indisponível'}
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwnMessage = msg.authorId === user?.id
                const showAvatar = idx === 0 || messages[idx - 1].authorId !== msg.authorId

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    {showAvatar ? (
                      <Avatar className="h-9 w-9 border-2 border-brand-purple/30 flex-shrink-0">
                        <AvatarImage src={msg.author.image || ''} />
                        <AvatarFallback className="bg-brand-purple-dark/50 text-brand-purple-lighter text-xs">
                          {msg.author.name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-9 flex-shrink-0" />
                    )}
                    <div className={`flex-1 max-w-[75%] ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                          <p className="text-sm font-semibold text-white flex items-center">
                            {msg.author.name || 'Usuário'}
                            {getRoleBadge(msg.author.role)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-brand-purple-dark to-brand-purple-dark text-white'
                            : 'bg-gray-800/80 border border-gray-700/50 text-gray-100'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
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
      <div className="p-4 border-t border-brand-purple/20 flex-shrink-0">
        {chatEnabled ? (
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="bg-black/50 border-brand-purple/30 text-white placeholder:text-gray-500 focus:border-brand-purple-light"
              disabled={sending}
              maxLength={2000}
            />
            <Button
              type="submit"
              disabled={sending || !message.trim()}
              className="bg-gradient-to-r from-brand-purple-dark to-brand-purple-dark hover:from-brand-purple hover:to-brand-purple-dark text-white px-6"
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
          <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-gray-300 font-medium font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Chat desabilitado
              </p>
              <p className="text-gray-500 text-sm">
                {disabledReason || 'Chat disponível apenas para pedidos em andamento.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
