'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  Package,
  CheckCircle2,
  DollarSign,
  Check,
  Loader2,
  Upload,
  ImageIcon,
  X,
  RefreshCw,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatCard } from '@/components/common/stat-card'
import { StatusBadge, OrderStatus } from '@/components/common/status-badge'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { SkeletonOrdersList, SkeletonStatsGrid } from '@/components/common/skeletons'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ActionButton } from '@/components/common/action-button'
import { RefreshingBanner } from '@/components/common/refreshing-banner'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'
import { showSuccess, showError } from '@/lib/toast'
import { OrderChat } from '@/components/order/order-chat'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { useRealtime } from '@/hooks/use-realtime'

interface Order {
  id: number
  status: OrderStatus
  total: number
  boosterCommission?: number | null
  boosterPercentage?: number | null
  createdAt: string
  boosterId?: number | null
  user: {
    id: number
    email: string
    name?: string
  }
  service: {
    id: number
    name: string
    game: string
    type: string
    description: string
  }
  booster?: {
    id: number
    email: string
    name?: string
  }
  commission?: {
    id: number
    amount: number
    percentage: number
    status: string
    paidAt?: string | null
  } | null
}

interface Stats {
  available: number
  assigned: number
  completed: number
  totalEarnings: number
  pendingEarnings: number
}


export default function BoosterDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const { loading, refreshing, withLoading } = useLoading({ initialLoading: true })
  const [activeTab, setActiveTab] = useState('available')
  const initialTabSet = useRef(false)
  const [orderToAction, setOrderToAction] = useState<number | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [alert, setAlert] = useState<{ title: string; description: string; variant: 'default' | 'destructive' } | null>(null)
  // Proof upload state
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasPixKey, setHasPixKey] = useState<boolean | null>(null)
  const [hasCredentialsMap, setHasCredentialsMap] = useState<Record<number, boolean>>({})
  const [startingOrderId, setStartingOrderId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/login')
    } else if (user && user.role !== 'BOOSTER') {
      // Redirecionar baseado no role usando replace
      if (user.role === 'ADMIN') {
        router.replace('/admin')
      } else if (user.role === 'CLIENT') {
        router.replace('/dashboard')
      } else {
        router.replace('/')
      }
    }
  }, [user, authLoading, router])

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    if (user && user.role === 'BOOSTER') {
      fetchOrders(false)
      fetch('/api/user/bank-account')
        .then((r) => r.json())
        .then((data) => setHasPixKey(!!data.pixKey))
        .catch(() => setHasPixKey(true)) // fail open — server will enforce
    }
  }, [user?.id]) // Usar apenas user.id para evitar re-renders desnecessários

  // On first stats load, default to 'assigned' tab if booster has in-progress orders
  useEffect(() => {
    if (stats && !initialTabSet.current) {
      initialTabSet.current = true
      if (stats.assigned > 0) {
        setActiveTab('assigned')
      }
    }
  }, [stats])

  // Recarregar quando tab muda, mas sem mostrar loading completo
  useEffect(() => {
    if (user && user.role === 'BOOSTER' && !loading) {
      fetchOrders(true)
    }
  }, [activeTab])

  // Função para atualizar apenas os dados sem mostrar banner de refreshing
  const updateOrdersSilently = async () => {
    const params = new URLSearchParams()
    if (activeTab === 'available') {
      params.append('type', 'available')
    } else if (activeTab === 'assigned') {
      params.append('type', 'assigned')
    } else if (activeTab === 'completed') {
      params.append('type', 'completed')
    }

    try {
      const response = await fetch(`/api/booster/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Erro ao atualizar pedidos silenciosamente:', error)
    }
  }

  // Atualizações em tempo real via SSE - atualização silenciosa
  useRealtime({
    enabled: user?.role === 'BOOSTER',
    onOrderUpdate: (data) => {
      // Atualizar silenciosamente quando houver mudanças nos pedidos disponíveis
      if (data.available !== undefined) {
        const previousAvailable = stats?.available || 0
        
        // Atualizar apenas quando o número de pedidos disponíveis mudou
        // Isso evita atualizações desnecessárias
        if (data.available !== previousAvailable) {
          // Se estiver na aba de disponíveis, atualizar a lista
          if (activeTab === 'available') {
            updateOrdersSilently()
          } else {
            // Se não está na aba de disponíveis, apenas atualizar stats
            updateOrdersSilently()
          }
        }
      }
      // Atualizar quando meus pedidos mudarem (se estiver na aba de assigned)
      if (data.myOrders !== undefined && activeTab === 'assigned') {
        updateOrdersSilently()
      }
    },
  })

  const fetchOrders = async (isRefresh = false) => {
    await withLoading(async () => {
      const params = new URLSearchParams()
      if (activeTab === 'available') {
        params.append('type', 'available')
      } else if (activeTab === 'assigned') {
        params.append('type', 'assigned')
      } else if (activeTab === 'completed') {
        params.append('type', 'completed')
      }

      const response = await fetch(`/api/booster/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setStats(data.stats || null)
      }
    }, isRefresh)
  }

  const handleStartOrder = async (orderId: number) => {
    setStartingOrderId(orderId)
    try {
      const res = await fetch(`/api/booster/orders/${orderId}/start`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showSuccess('Boost iniciado com sucesso!')
        fetchOrders(true)
      } else {
        showError(data.message || 'Erro ao iniciar pedido')
      }
    } catch {
      showError('Erro ao iniciar pedido')
    } finally {
      setStartingOrderId(null)
    }
  }

  const handleAcceptOrderClick = (orderId: number) => {
    setOrderToAction(orderId)
    setAcceptDialogOpen(true)
  }

  const handleAcceptOrder = async () => {
    if (!orderToAction) return

    setIsAccepting(true)
    try {
      const response = await fetch(`/api/booster/orders/${orderToAction}`, {
        method: 'POST',
      })

      if (response.ok) {
        setAcceptDialogOpen(false)
        setOrderToAction(null)
        setAlert({
          title: 'Sucesso',
          description: 'Pedido aceito com sucesso!',
          variant: 'default',
        })
        fetchOrders(true) // Refresh sem loading completo
        setTimeout(() => setAlert(null), 5000)
      } else {
        const data = await response.json()
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao aceitar pedido',
          variant: 'destructive',
        })
        setTimeout(() => setAlert(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao aceitar pedido',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleCompleteOrderClick = (orderId: number) => {
    setOrderToAction(orderId)
    setProofFile(null)
    setProofPreview(null)
    setCompleteDialogOpen(true)
  }

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setProofPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveProof = () => {
    setProofFile(null)
    setProofPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCompleteOrder = async () => {
    if (!orderToAction || !proofFile) return

    setIsUploading(true)
    try {
      // 1. Upload the proof screenshot
      const formData = new FormData()
      formData.append('file', proofFile)
      const uploadResponse = await fetch('/api/upload/completion-proof', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const uploadData = await uploadResponse.json()
        setAlert({
          title: 'Erro no upload',
          description: uploadData.message || 'Erro ao enviar o print. Tente novamente.',
          variant: 'destructive',
        })
        setTimeout(() => setAlert(null), 6000)
        return
      }

      const { url: completionProofUrl } = await uploadResponse.json()

      // 2. Mark order as completed with the proof URL
      setIsUploading(false)
      setIsCompleting(true)
      const response = await fetch(`/api/booster/orders/${orderToAction}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', completionProofUrl }),
      })

      if (response.ok) {
        setCompleteDialogOpen(false)
        setOrderToAction(null)
        setProofFile(null)
        setProofPreview(null)
        setAlert({
          title: 'Sucesso',
          description: 'Pedido marcado como concluído!',
          variant: 'default',
        })
        fetchOrders(true)
        setTimeout(() => setAlert(null), 5000)
      } else {
        const data = await response.json()
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao atualizar pedido',
          variant: 'destructive',
        })
        setTimeout(() => setAlert(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao concluir pedido:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao concluir pedido',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    } finally {
      setIsUploading(false)
      setIsCompleting(false)
    }
  }


  // Loading de tela inteira apenas para autenticação
  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'BOOSTER') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        {alert && (
          <Alert variant={alert.variant} className="mb-4">
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}
        <PageHeader
          highlight="MEUS"
          title="TRABALHOS"
          description={`Olá, ${user.name || user.email}! Gerencie seus pedidos e ganhos.`}
        />

        {hasPixKey === false && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-xl flex items-center gap-3">
            <div className="flex-1">
              <p className="text-yellow-300 font-semibold font-orbitron text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                CHAVE PIX NÃO CADASTRADA
              </p>
              <p className="text-yellow-400/80 text-sm font-rajdhani mt-0.5" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Você precisa cadastrar sua chave PIX para aceitar pedidos e receber pagamentos.
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold flex-shrink-0">
                Cadastrar PIX
              </Button>
            </Link>
          </div>
        )}

        {/* Cards de Estatísticas e Navegação */}
        {loading && !stats ? (
          <SkeletonStatsGrid count={5} />
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Card - Disponíveis */}
            <Card className="bg-brand-black/30 border-yellow-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-gray-500 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Disponíveis
                    </p>
                    <p className="text-3xl font-bold text-yellow-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {stats.available}
                    </p>
                    <p className="text-xs text-brand-gray-500 mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Pedidos pendentes
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-yellow-500/60" />
                </div>
              </CardContent>
            </Card>

            {/* Card - Em Andamento */}
            <Card className="bg-brand-black/30 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-gray-500 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Em Andamento
                    </p>
                    <p className="text-3xl font-bold text-blue-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {stats.assigned}
                    </p>
                    <p className="text-xs text-brand-gray-500 mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Pedidos ativos
                    </p>
                  </div>
                  <Loader2 className="h-8 w-8 text-blue-500/60" />
                </div>
              </CardContent>
            </Card>

            {/* Card - Concluídos */}
            <Card className="bg-brand-black/30 border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-gray-500 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Concluídos
                    </p>
                    <p className="text-3xl font-bold text-green-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {stats.completed}
                    </p>
                    <p className="text-xs text-brand-gray-500 mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Pedidos finalizados
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500/60" />
                </div>
              </CardContent>
            </Card>

            <StatCard
              title="Ganhos Pendentes"
              value={formatPrice(stats.pendingEarnings)}
              description="Aguardando pagamento"
              icon={DollarSign}
              valueColor="text-yellow-300"
            />
          </div>
        ) : null}

        {/* Tabs de navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-brand-black-light border border-brand-purple/30 rounded-lg p-1 gap-1 h-auto">
            <TabsTrigger
              value="available"
              className="font-rajdhani font-bold transition-all duration-200 rounded-md py-2 px-4
                data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                data-[state=inactive]:text-brand-gray-500 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-brand-purple/20"
            >
              Disponíveis
              {stats && stats.available > 0 && (
                <span className="ml-2 bg-yellow-500/20 text-yellow-300 text-xs px-1.5 py-0.5 rounded font-bold">
                  {stats.available}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="assigned"
              className="font-rajdhani font-bold transition-all duration-200 rounded-md py-2 px-4
                data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                data-[state=inactive]:text-brand-gray-500 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-brand-purple/20"
            >
              Em Andamento
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="font-rajdhani font-bold transition-all duration-200 rounded-md py-2 px-4
                data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                data-[state=inactive]:text-brand-gray-500 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-brand-purple/20"
            >
              Concluídos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pedidos Disponíveis */}
        {activeTab === 'available' && (
          <div className="mt-6">
            {refreshing && <RefreshingBanner />}
            {loading && !refreshing ? (
              <SkeletonOrdersList count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Nenhum pedido disponível"
                description="Não há pedidos pendentes no momento."
              />
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => {
                  return (
                    <Card
                      key={order.id}
                      className="group relative bg-gradient-to-br from-brand-black/40 via-brand-black/30 to-brand-black/40 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-xl hover:shadow-brand-purple/20 transition-colors duration-200 overflow-hidden"
                    >
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/5 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
                      <CardHeader className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white font-orbitron mb-2 group-hover:text-brand-purple-light transition-colors duration-200" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {order.service.name}
                            </CardTitle>
                            <CardDescription className="text-brand-gray-500 font-rajdhani group-hover:text-gray-300 transition-colors duration-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.service.description}
                            </CardDescription>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {order.commission && (
                              <OrderInfoItem
                                label="Sua Comissão"
                                value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.commission.amount)} ({(order.commission.percentage * 100).toFixed(0)}%)</span>}
                              />
                            )}
                            {order.boosterCommission && !order.commission && (
                              <OrderInfoItem
                                label="Sua Comissão"
                                value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.boosterCommission)} ({(order.boosterPercentage ? order.boosterPercentage * 100 : 70).toFixed(0)}%)</span>}
                              />
                            )}
                            <OrderInfoItem label="Cliente" value={order.user.name || order.user.email} />
                            <OrderInfoItem label="Jogo" value={order.service.game} />
                          </div>

                          <ActionButton
                            onClick={() => handleAcceptOrderClick(order.id)}
                            icon={Check}
                            className="w-full"
                            disabled={!hasPixKey}
                            title={!hasPixKey ? 'Cadastre sua chave PIX no perfil para aceitar pedidos' : undefined}
                          >
                            Aceitar Pedido
                          </ActionButton>
                          <ConfirmDialog
                            open={acceptDialogOpen && orderToAction === order.id}
                            onOpenChange={setAcceptDialogOpen}
                            title="Aceitar Pedido"
                            description="Tem certeza que deseja aceitar este pedido? Você será responsável por completar o serviço."
                            confirmLabel="Aceitar"
                            cancelLabel="Cancelar"
                            onConfirm={handleAcceptOrder}
                            loading={isAccepting}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Pedidos em Andamento */}
        {activeTab === 'assigned' && (
          <div className="mt-6">
            {refreshing && <RefreshingBanner />}
            {loading && !refreshing ? (
              <SkeletonOrdersList count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Loader2}
                title="Nenhum pedido em andamento"
                description="Você não tem pedidos em progresso no momento."
              />
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => {
                  return (
                    <Card
                      key={order.id}
                      className="group relative bg-gradient-to-br from-brand-black/40 via-brand-black/30 to-brand-black/40 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-xl hover:shadow-brand-purple/20 transition-colors duration-200 overflow-hidden"
                    >
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/5 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
                      <CardHeader className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white font-orbitron mb-2 group-hover:text-brand-purple-light transition-colors duration-200" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {order.service.name}
                            </CardTitle>
                            <CardDescription className="text-brand-gray-500 font-rajdhani group-hover:text-gray-300 transition-colors duration-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.service.description}
                            </CardDescription>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {order.commission && (
                              <OrderInfoItem
                                label="Sua Comissão"
                                value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.commission.amount)} ({(order.commission.percentage * 100).toFixed(0)}%)</span>}
                              />
                            )}
                            {order.boosterCommission && !order.commission && (
                              <OrderInfoItem
                                label="Sua Comissão"
                                value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.boosterCommission)} ({(order.boosterPercentage ? order.boosterPercentage * 100 : 70).toFixed(0)}%)</span>}
                              />
                            )}
                            <OrderInfoItem label="Cliente" value={order.user.name || order.user.email} />
                            <OrderInfoItem label="Data do Pedido" value={formatDate(order.createdAt)} />
                          </div>

                          {/* Chat for PAID orders awaiting credentials */}
                          {order.status === 'PAID' && (
                            <div className="border-t border-white/10 pt-4">
                              <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-yellow-300 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                  Aguardando credenciais Steam do cliente. Peça ao cliente para enviar pelo chat abaixo.
                                </p>
                              </div>
                              <OrderChat
                                orderId={order.id}
                                onMessagesUpdate={(messages) => {
                                  const hasCreds = messages.some(
                                    (m) => m.messageType === 'STEAM_CREDENTIALS' && !m.isExpired
                                  )
                                  setHasCredentialsMap((prev) => ({ ...prev, [order.id]: hasCreds }))
                                }}
                              />
                              <div className="mt-3 flex justify-end">
                                <Button
                                  onClick={() => handleStartOrder(order.id)}
                                  disabled={!hasCredentialsMap[order.id] || startingOrderId === order.id}
                                  className="bg-green-600 hover:bg-green-500 text-white font-bold disabled:opacity-40"
                                  title={!hasCredentialsMap[order.id] ? 'Aguardando credenciais Steam do cliente' : undefined}
                                >
                                  {startingOrderId === order.id ? (
                                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Iniciando...</>
                                  ) : (
                                    'Iniciar Boost'
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Chat + complete button for IN_PROGRESS orders */}
                          {order.status === 'IN_PROGRESS' && (
                            <>
                              <div className="border-t border-white/10 pt-4">
                                <OrderChat orderId={order.id} />
                              </div>
                              <ActionButton
                                onClick={() => handleCompleteOrderClick(order.id)}
                                variant="success"
                                icon={CheckCircle2}
                                className="w-full"
                              >
                                Marcar como Concluído
                              </ActionButton>
                            </>
                          )}

                          {/* Completion proof dialog */}
                          <Dialog
                            open={completeDialogOpen && orderToAction === order.id}
                            onOpenChange={(open) => {
                              if (!open) { setProofFile(null); setProofPreview(null) }
                              setCompleteDialogOpen(open)
                            }}
                          >
                            <DialogContent className="bg-brand-black-light border-brand-purple/50 max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                  Comprovante de Conclusão
                                </DialogTitle>
                                <DialogDescription className="text-brand-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                  Anexe um print da tela mostrando que o cliente atingiu o rank/rating contratado. Isso é obrigatório para concluir o pedido.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 py-2">
                                {proofPreview ? (
                                  <div className="relative">
                                    <img
                                      src={proofPreview}
                                      alt="Preview do comprovante"
                                      className="w-full rounded-lg border border-brand-purple/30 object-cover max-h-56"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleRemoveProof}
                                      className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-red-600/80 transition-colors"
                                    >
                                      <X className="h-4 w-4 text-white" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-brand-purple/40 hover:border-brand-purple/80 rounded-lg p-8 flex flex-col items-center gap-3 transition-colors cursor-pointer bg-brand-purple/5 hover:bg-brand-purple/10"
                                  >
                                    <ImageIcon className="h-10 w-10 text-brand-purple-light/60" />
                                    <span className="text-brand-gray-400 font-rajdhani text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                      Clique para selecionar o print
                                    </span>
                                    <span className="text-brand-gray-500 font-rajdhani text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                      JPG, PNG ou WebP — máx. 5 MB
                                    </span>
                                  </button>
                                )}
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  className="hidden"
                                  onChange={handleProofFileChange}
                                />
                              </div>

                              <DialogFooter className="gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => { setCompleteDialogOpen(false); setProofFile(null); setProofPreview(null) }}
                                  className="border-brand-purple/40 text-brand-gray-300 hover:bg-brand-purple/10"
                                  disabled={isUploading || isCompleting}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={handleCompleteOrder}
                                  disabled={!proofFile || isUploading || isCompleting}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {isUploading ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando print...</>
                                  ) : isCompleting ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Concluindo...</>
                                  ) : (
                                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Concluir Pedido</>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Pedidos Concluídos */}
        {activeTab === 'completed' && (
          <div className="mt-6">
            {refreshing && <RefreshingBanner />}
            {loading && !refreshing ? (
              <SkeletonOrdersList count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nenhum pedido concluído"
                description="Você ainda não concluiu nenhum pedido."
              />
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => {
                  return (
                    <Card
                      key={order.id}
                      className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {order.service.name}
                            </CardTitle>
                            <CardDescription className="text-brand-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.service.description}
                            </CardDescription>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {order.commission && (
                            <OrderInfoItem
                              label="Sua Comissão"
                              value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.commission.amount)} ({(order.commission.percentage * 100).toFixed(0)}%) {order.commission.status === 'PAID' ? '✓ Pago' : '⏳ Pendente'}</span>}
                            />
                          )}
                          {order.boosterCommission && !order.commission && (
                            <OrderInfoItem
                              label="Sua Comissão"
                              value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.boosterCommission)} ({(order.boosterPercentage ? order.boosterPercentage * 100 : 70).toFixed(0)}%)</span>}
                            />
                          )}
                          <OrderInfoItem label="Cliente" value={order.user.name || order.user.email} />
                          <OrderInfoItem label="Data de Conclusão" value={formatDate(order.createdAt)} />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
    </div>
  )
}

