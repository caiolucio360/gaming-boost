'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Send,
  MessageCircle,
  Lock,
  AlertCircle,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { showError } from '@/lib/toast'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { formatMessageTime } from '@/lib/utils'

interface ChatMessage {
  id: number
  content: string
  messageType?: 'TEXT' | 'STEAM_CREDENTIALS'
  isExpired?: boolean
  authorId: number
  author: {
    id: number
    name: string | null
    image: string | null
    role: string
  }
  createdAt: string
}

function SteamCredentialsCard({
  content,
  isExpired,
  isOwnMessage,
}: {
  content: string
  isExpired?: boolean
  isOwnMessage: boolean
}) {
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!revealed) return
    setTimeLeft(30)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          setRevealed(false)
          return null
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [revealed])

  if (isExpired) {
    return (
      <div className="rounded-2xl px-4 py-3 bg-brand-gray-800/50 border border-brand-gray-700/50">
        <p className="text-sm text-muted-foreground italic">[Credenciais removidas após conclusão do pedido]</p>
      </div>
    )
  }

  let username = ''
  let password = ''
  try {
    const parsed = JSON.parse(content)
    username = parsed.username
    password = parsed.password
  } catch {
    return (
      <div className="rounded-2xl px-4 py-3 bg-brand-gray-800/50 border border-brand-gray-700/50">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-brand-purple-light" />
          <span className="text-xs font-semibold text-brand-purple-light">Credenciais Steam</span>
        </div>
        <p className="text-sm text-muted-foreground">{content}</p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl px-4 py-3 border ${
        isOwnMessage
          ? 'bg-brand-purple-dark/30 border-brand-purple/50'
          : 'bg-brand-gray-800/80 border-brand-gray-700/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-brand-purple-light" />
        <span className="text-xs font-semibold text-brand-purple-light">Credenciais Steam</span>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Usuário</p>
          <p className="text-sm text-foreground font-mono">{username}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Senha</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground font-mono">
              {revealed ? password : '••••••••'}
            </p>
            <button
              onClick={() => setRevealed((r) => !r)}
              className="text-xs text-brand-purple-light hover:text-brand-purple underline flex items-center gap-1"
            >
              {revealed ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  {timeLeft !== null ? `Ocultar (${timeLeft}s)` : 'Ocultar'}
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  Revelar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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
  /** Called whenever messages are fetched. Receives the latest messages array. */
  onMessagesUpdate?: (messages: ChatMessage[]) => void
}

export function OrderChat({ orderId, className, onMessagesUpdate }: OrderChatProps) {
  const { user } = useAuth()
  const [chat, setChat] = useState<OrderChatData | null>(null)
  const [chatEnabled, setChatEnabled] = useState(false)
  const [disabledReason, setDisabledReason] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [credentialMode, setCredentialMode] = useState(false)
  const [credUsername, setCredUsername] = useState('')
  const [credPassword, setCredPassword] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const fetchChat = useCallback(async () => {
    try {
      const data = await api.get<{
        chat: typeof chat
        chatEnabled: boolean
        disabledReason: typeof disabledReason
      }>(`/api/orders/${orderId}/chat`)
      setChat(data.chat)
      setChatEnabled(data.chatEnabled)
      setDisabledReason(data.disabledReason)
      setLastUpdate(new Date())
      if (data.chat?.messages && onMessagesUpdate) {
        onMessagesUpdate(data.chat.messages)
      }
    } catch (error) {
      console.error('Erro ao buscar chat:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId, onMessagesUpdate])

  useEffect(() => {
    fetchChat()
    const interval = setInterval(fetchChat, 3000)
    return () => clearInterval(interval)
  }, [fetchChat])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [chat?.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      await api.post(`/api/orders/${orderId}/chat`, { content: message })

      setMessage('')
      await fetchChat()
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const handleSendCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!credUsername.trim() || !credPassword.trim() || sending) return

    setSending(true)
    try {
      await api.post(`/api/orders/${orderId}/chat`, {
        messageType: 'STEAM_CREDENTIALS',
        credentials: { username: credUsername, password: credPassword },
      })

      setCredUsername('')
      setCredPassword('')
      setCredentialMode(false)
      await fetchChat()
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Erro ao enviar credenciais')
    } finally {
      setSending(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-500/20 text-foreground dark:text-red-300 border-red-500/50 text-xs ml-2">Admin</Badge>
      case 'BOOSTER':
        return <Badge className="bg-brand-purple/20 text-brand-purple-light border-brand-purple/50 text-xs ml-2">Booster</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br from-brand-gray-900/80 to-brand-gray-800/40 backdrop-blur-xl border border-brand-purple/30 ${className || ''}`}>
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

  const chatContent = (
    <>
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollAreaRef}
          className="h-full overflow-y-auto p-4"
        >
          <div className="space-y-4 pb-4">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-purple/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-brand-purple-light" />
                </div>
                <p className="text-muted-foreground font-rajdhani">
                  Nenhuma mensagem ainda
                </p>
                <p className="text-brand-gray-600 text-sm mt-1">
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
                          <p className="text-sm font-semibold text-foreground flex items-center">
                            {msg.author.name || 'Usuário'}
                            {getRoleBadge(msg.author.role)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      )}
                      <div className={msg.messageType !== 'STEAM_CREDENTIALS' ? `rounded-2xl px-4 py-2.5 ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-brand-purple-dark to-brand-purple-dark text-white'
                            : 'bg-brand-gray-800/80 border border-brand-gray-700/50 text-brand-gray-100'
                        }` : ''}>
                        {msg.messageType === 'STEAM_CREDENTIALS' ? (
                          <SteamCredentialsCard
                            content={msg.content}
                            isExpired={msg.isExpired}
                            isOwnMessage={isOwnMessage}
                          />
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                      </div>
                      {!showAvatar && (
                        <p className={`text-xs text-brand-gray-600 mt-1 ${isOwnMessage ? 'text-right' : ''}`}>
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-brand-purple/20 flex-shrink-0">
        {chatEnabled ? (
          <div className="space-y-3">
            {user?.role === 'CLIENT' && !credentialMode && (
              <button
                type="button"
                onClick={() => setCredentialMode(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/50 hover:border-yellow-400/80 hover:from-yellow-500/30 hover:to-amber-500/20 transition-all group"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                  <KeyRound className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-foreground dark:text-yellow-300 font-orbitron leading-tight">
                    Enviar Credenciais Steam
                  </p>
                  <p className="text-xs text-yellow-500/80 mt-0.5">
                    Necessário para o booster iniciar o boost
                  </p>
                </div>
                <Send className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              </button>
            )}

            {credentialMode && user?.role === 'CLIENT' ? (
              <form onSubmit={handleSendCredentials} className="space-y-2">
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/30 rounded-lg space-y-2">
                  <p className="text-xs text-yellow-400 flex items-center gap-1.5 font-semibold">
                    <Shield className="h-3.5 w-3.5" />
                    Criptografado — só o booster designado poderá ver
                  </p>
                  <Input
                    value={credUsername}
                    onChange={(e) => setCredUsername(e.target.value)}
                    placeholder="Usuário Steam"
                    className="bg-background/50 border-brand-purple/30 text-foreground placeholder:text-muted-foreground focus:border-brand-purple-light"
                    disabled={sending}
                    autoComplete="off"
                  />
                  <Input
                    type="password"
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    placeholder="Senha Steam"
                    className="bg-background/50 border-brand-purple/30 text-foreground placeholder:text-muted-foreground focus:border-brand-purple-light"
                    disabled={sending}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setCredentialMode(false); setCredUsername(''); setCredPassword('') }}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={sending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={sending || !credUsername.trim() || !credPassword.trim()}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                  >
                    {sending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Enviar com segurança
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem…"
                  className="bg-black/50 border-brand-purple/30 text-foreground placeholder:text-muted-foreground focus:border-brand-purple-light"
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
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-brand-gray-800/50 border border-brand-gray-700/50 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-muted-foreground font-medium font-rajdhani">
                Chat desabilitado
              </p>
              <p className="text-muted-foreground text-sm">
                {disabledReason || 'Chat disponível apenas para pedidos em andamento.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )

  const securityNotice = (
    <div className="px-4 py-2 bg-brand-purple/5 border-b border-brand-purple/20 flex-shrink-0">
      <div className="flex items-start gap-2 text-xs">
        <Shield className="h-4 w-4 text-brand-purple-light flex-shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          Suas mensagens são criptografadas com AES-256-GCM. Compartilhe suas credenciais Steam com segurança apenas com o booster designado.
        </p>
      </div>
    </div>
  )

  return (
    <>
      <Card className={`bg-gradient-to-br from-brand-gray-900/80 to-brand-gray-800/40 backdrop-blur-xl border border-brand-purple/30 h-[500px] flex flex-col ${className || ''}`}>
        <CardHeader className="border-b border-brand-purple/20 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground font-orbitron flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-brand-purple-light" />
              Chat do Pedido
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Lock className="h-3 w-3" />
                <span>Criptografado</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>{formatMessageTime(lastUpdate.toISOString())}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                title="Expandir chat"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        {securityNotice}
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          {chatContent}
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0 bg-gradient-to-br from-brand-gray-900/95 to-brand-gray-800/95 backdrop-blur-xl border border-brand-purple/30">
          <DialogHeader className="border-b border-brand-purple/20 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-foreground font-orbitron flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-brand-purple-light" />
                Chat do Pedido
              </DialogTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <Lock className="h-3 w-3" />
                  <span>Criptografado</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title="Minimizar chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </DialogHeader>
          {securityNotice}
          <div className="flex-1 overflow-hidden flex flex-col">
            {chatContent}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
