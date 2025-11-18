'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { formatPrice } from '@/lib/utils'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ActionButton } from '@/components/common/action-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Package,
  ArrowLeft,
  Loader2,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/loading-spinner'

interface Service {
  id: number
  name: string
  description: string
  game: 'CS2'
  type: 'RANK_BOOST'
  price: number
  duration: string
  createdAt: string
  _count: {
    orders: number
  }
}

export default function AdminServicesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [filterGame, setFilterGame] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<{ id: number; name: string } | null>(null)
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/')
    } else if (user && user.role === 'ADMIN') {
      fetchServices()
    }
  }, [user, authLoading, router, filterGame, filterType])

  const fetchServices = async () => {
    await withLoading(async () => {
      const params = new URLSearchParams()
      if (filterGame) params.append('game', filterGame)
      if (filterType) params.append('type', filterType)

      const response = await fetch(`/api/admin/services?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    })
  }

  const handleDeleteClick = (serviceId: number, serviceName: string) => {
    setServiceToDelete({ id: serviceId, name: serviceName })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!serviceToDelete) return

    try {
      const response = await fetch(`/api/admin/services/${serviceToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setServiceToDelete(null)
        setAlert({
          title: 'Sucesso',
          description: 'Serviço deletado com sucesso!',
          variant: 'default',
        })
        fetchServices()
        setTimeout(() => setAlert(null), 5000)
      } else {
        const data = await response.json()
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao deletar serviço',
          variant: 'destructive',
        })
        setTimeout(() => setAlert(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao deletar serviço:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao deletar serviço',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    }
  }


  const getGameBadge = (game: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      CS2: {
        label: 'CS2',
        color: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      },
    }
    return configs[game] || configs.CS2
  }

  const getTypeBadge = (type: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      RANK_BOOST: {
        label: 'Rank Boost',
        color: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      },
    }
    return configs[type] || configs.RANK_BOOST
  }

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {alert && (
          <Alert variant={alert.variant} className="mb-4">
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-purple-300 hover:text-purple-200 font-rajdhani mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
                <span className="text-purple-300">GERENCIAR</span>
                <span className="text-white"> SERVIÇOS</span>
              </h1>
              <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
                Visualize e gerencie todos os serviços da plataforma
              </p>
            </div>
            <Button
              asChild
              className="bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
            >
              <Link href="/admin/services/new">
                <Plus className="mr-2 h-4 w-4" />
                Novo Serviço
              </Link>
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-black/30 backdrop-blur-md border-purple-500/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={filterGame || undefined} onValueChange={(value) => setFilterGame(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full md:w-[200px] bg-black/50 border-purple-500/50 text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <SelectValue placeholder="Todos os jogos" />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/50">
                  <SelectItem value="all">Todos os jogos</SelectItem>
                  <SelectItem value="CS2">Counter-Strike 2</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType || undefined} onValueChange={(value) => setFilterType(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full md:w-[200px] bg-black/50 border-purple-500/50 text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/50">
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="RANK_BOOST">Rank Boost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Serviços */}
        {services.length === 0 ? (
          <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Nenhum serviço encontrado
                </h3>
                <p className="text-gray-400 font-rajdhani mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Tente ajustar os filtros ou criar um novo serviço
                </p>
                <Button
                  asChild
                  className="bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
                  style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                >
                  <Link href="/admin/services/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Serviço
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {services.map((service) => {
              const gameInfo = getGameBadge(service.game)
              const typeInfo = getTypeBadge(service.type)

              return (
                <Card
                  key={service.id}
                  className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {service.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400 font-rajdhani mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {service.description}
                        </CardDescription>
                        <div className="flex gap-2">
                          <Badge className={`${gameInfo.color} border font-rajdhani`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {gameInfo.label}
                          </Badge>
                          <Badge className={`${typeInfo.color} border font-rajdhani`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            Preço
                          </p>
                          <p className="text-lg font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {formatPrice(service.price)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            Duração
                          </p>
                          <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {service.duration}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            Pedidos
                          </p>
                          <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {service._count.orders} pedido{service._count.orders !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-purple-500/20">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 font-rajdhani"
                          style={{ fontFamily: 'Rajdhani, sans-serif' }}
                        >
                          <Link href={`/admin/services/${service.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </Button>
                        {service._count.orders === 0 && (
                          <>
                            <ActionButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteClick(service.id, service.name)}
                              icon={Trash2}
                            />
                            <ConfirmDialog
                              open={deleteDialogOpen && serviceToDelete?.id === service.id}
                              onOpenChange={setDeleteDialogOpen}
                              title="Deletar Serviço"
                              description={`Tem certeza que deseja deletar o serviço "${service.name}"? Esta ação não pode ser desfeita.`}
                              confirmLabel="Deletar"
                              cancelLabel="Cancelar"
                              onConfirm={handleDelete}
                              variant="destructive"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Total: {services.length} serviço{services.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

