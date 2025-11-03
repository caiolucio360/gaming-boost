'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  CheckCircle2,
  DollarSign,
  Check,
  Loader2,
} from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { StatusBadge, OrderStatus } from '@/components/common/status-badge'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { DashboardCard } from '@/components/common/dashboard-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

interface Order {
  id: string
  status: OrderStatus
  total: number
  createdAt: string
  boosterId?: string | null
  user: {
    id: string
    email: string
    name?: string
  }
  service: {
    id: string
    name: string
    game: string
    type: string
    description: string
  }
  booster?: {
    id: string
    email: string
    name?: string
  }
}

interface Stats {
  available: number
  assigned: number
  completed: number
  totalEarnings: {
    total: number | null
  }
}


export default function BoosterDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('available')
  const [orderToAction, setOrderToAction] = useState<string | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [alert, setAlert] = useState<{ title: string; description: string; variant: 'default' | 'destructive' } | null>(null)

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
    }
  }, [user?.id]) // Usar apenas user.id para evitar re-renders desnecessários

  // Recarregar quando tab muda, mas sem mostrar loading completo
  useEffect(() => {
    if (user && user.role === 'BOOSTER' && !loading) {
      fetchOrders(true)
    }
  }, [activeTab])

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

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
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAcceptOrderClick = (orderId: string) => {
    setOrderToAction(orderId)
    setAcceptDialogOpen(true)
  }

  const handleAcceptOrder = async () => {
    if (!orderToAction) return

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
    }
  }

  const handleCompleteOrderClick = (orderId: string) => {
    setOrderToAction(orderId)
    setCompleteDialogOpen(true)
  }

  const handleCompleteOrder = async () => {
    if (!orderToAction) return

    try {
      const response = await fetch(`/api/booster/orders/${orderToAction}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      if (response.ok) {
        setCompleteDialogOpen(false)
        setOrderToAction(null)
        setAlert({
          title: 'Sucesso',
          description: 'Pedido marcado como concluído!',
          variant: 'default',
        })
        fetchOrders(true) // Refresh sem loading completo
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
      console.error('Erro ao atualizar pedido:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao atualizar pedido',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (authLoading || (loading && !stats)) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'BOOSTER') {
    return null
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {refreshing && (
          <div className="mb-4 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-300 font-rajdhani text-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <Loader2 className="h-4 w-4 inline-block mr-2 animate-spin" />
              Atualizando...
            </p>
          </div>
        )}
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

        {/* Cards de Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Disponíveis"
              value={stats.available}
              description="Pedidos pendentes"
              icon={Package}
              iconColor="text-yellow-500"
            />
            <StatCard
              title="Em Andamento"
              value={stats.assigned}
              description="Pedidos ativos"
              icon={Loader2}
              iconColor="text-blue-500"
            />
            <StatCard
              title="Concluídos"
              value={stats.completed}
              description="Pedidos finalizados"
              icon={CheckCircle2}
              iconColor="text-green-500"
            />
            <StatCard
              title="Ganhos Totais"
              value={formatPrice(stats.totalEarnings.total || 0)}
              description="Pedidos concluídos"
              icon={DollarSign}
              valueColor="text-purple-300"
            />
          </div>
        )}

        {/* Tabs de Pedidos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/30 border border-purple-500/50">
            <TabsTrigger value="available" className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Disponíveis ({stats?.available || 0})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Em Andamento ({stats?.assigned || 0})
            </TabsTrigger>
            <TabsTrigger value="completed" className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Concluídos ({stats?.completed || 0})
            </TabsTrigger>
          </TabsList>

          {/* Pedidos Disponíveis */}
          <TabsContent value="available" className="mt-6">
            {orders.length === 0 ? (
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
                      className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {order.service.name}
                            </CardTitle>
                            <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.service.description}
                            </CardDescription>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                Valor Total
                              </p>
                              <p className="text-lg font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                {formatPrice(order.total)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                Cliente
                              </p>
                              <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                {order.user.name || order.user.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                Jogo
                              </p>
                              <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                {order.service.game}
                              </p>
                            </div>
                          </div>

                          <AlertDialog open={acceptDialogOpen && orderToAction === order.id} onOpenChange={setAcceptDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <Button
                                onClick={() => handleAcceptOrderClick(order.id)}
                                className="w-full bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
                            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Aceitar Pedido
                          </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-black/90 border-purple-500/50">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                  Aceitar Pedido
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                  Tem certeza que deseja aceitar este pedido? Você será responsável por completar o serviço.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleAcceptOrder}
                                  className="bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
                                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                                >
                                  Aceitar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Pedidos em Andamento */}
          <TabsContent value="assigned" className="mt-6">
            {orders.length === 0 ? (
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
                      className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {order.service.name}
                            </CardTitle>
                            <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.service.description}
                            </CardDescription>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                Valor Total
                              </p>
                              <p className="text-lg font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                {formatPrice(order.total)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                Cliente
                              </p>
                              <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                {order.user.name || order.user.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                Data do Pedido
                              </p>
                              <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>

                          <AlertDialog open={completeDialogOpen && orderToAction === order.id} onOpenChange={setCompleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <Button
                                onClick={() => handleCompleteOrderClick(order.id)}
                                className="w-full bg-green-500 hover:bg-green-400 text-white font-rajdhani"
                            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Marcar como Concluído
                          </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-black/90 border-purple-500/50">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                  Concluir Pedido
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                  Tem certeza que deseja marcar este pedido como concluído? Esta ação finaliza o serviço.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleCompleteOrder}
                                  className="bg-green-500 hover:bg-green-400 text-white font-rajdhani"
                                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                                >
                                  Concluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Pedidos Concluídos */}
          <TabsContent value="completed" className="mt-6">
            {orders.length === 0 ? (
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
                      className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {order.service.name}
                            </CardTitle>
                            <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.service.description}
                            </CardDescription>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              Valor Total
                            </p>
                            <p className="text-lg font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {formatPrice(order.total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              Cliente
                            </p>
                            <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.user.name || order.user.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              Data de Conclusão
                            </p>
                            <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

