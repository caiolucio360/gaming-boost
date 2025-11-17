'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Users,
  Search,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  UserPlus,
  Shield,
  User,
  Crown,
} from 'lucide-react'
import Link from 'next/link'
import { TableSkeleton } from '@/components/common/loading-skeletons'
import { formatDate } from '@/lib/utils'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ActionButton } from '@/components/common/action-button'

interface AdminUser {
  id: number
  email: string
  name?: string
  role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
  createdAt: string
  _count: {
    orders: number
  }
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const { loading, refreshing, withLoading } = useLoading({ initialLoading: true })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: number; email: string } | null>(null)
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/')
    } else if (user && user.role === 'ADMIN') {
      fetchUsers(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'ADMIN' && !authLoading && !loading) {
      fetchUsers(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole])

  const fetchUsers = async (isRefresh = false) => {
    try {
      await withLoading(async () => {
        const params = new URLSearchParams()
        if (filterRole) params.append('role', filterRole)
        if (searchTerm) params.append('search', searchTerm)

        const response = await fetch(`/api/admin/users?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Erro ao buscar usuários' }))
          setAlert({
            title: 'Erro',
            description: errorData.message || 'Erro ao buscar usuários',
            variant: 'destructive',
          })
          setTimeout(() => setAlert(null), 5000)
        }
      }, isRefresh)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao buscar usuários. Tente novamente.',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(true)
  }

  const handleDeleteClick = (userId: number, userEmail: string) => {
    setUserToDelete({ id: userId, email: userEmail })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setUserToDelete(null)
        setAlert({
          title: 'Sucesso',
          description: 'Usuário deletado com sucesso!',
          variant: 'default',
        })
        fetchUsers(true)
        setTimeout(() => setAlert(null), 5000)
      } else {
        const data = await response.json()
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao deletar usuário',
          variant: 'destructive',
        })
        setTimeout(() => setAlert(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao deletar usuário',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    }
  }

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      ADMIN: {
        label: 'Admin',
        color: 'bg-red-500/20 text-red-300 border-red-500/50',
        icon: Crown,
      },
      BOOSTER: {
        label: 'Booster',
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        icon: Shield,
      },
      CLIENT: {
        label: 'Cliente',
        color: 'bg-green-500/20 text-green-300 border-green-500/50',
        icon: User,
      },
    }
    return configs[role] || configs.CLIENT
  }


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
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
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-purple-300 hover:text-purple-200 font-rajdhani mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">GERENCIAR</span>
            <span className="text-white"> USUÁRIOS</span>
          </h1>
          <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Visualize e gerencie todos os usuários da plataforma
          </p>
        </div>

        {/* Filtros e Busca */}
        <Card className="bg-black/30 backdrop-blur-md border-purple-500/50 mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por email ou nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/50 border-purple-500/50 text-white font-rajdhani"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  />
                </div>
              </div>
              <Select 
                value={filterRole || undefined} 
                onValueChange={(value) => {
                  setFilterRole(value === 'all' ? '' : value)
                }}
              >
                <SelectTrigger className="w-full md:w-[200px] bg-black/50 border-purple-500/50 text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <SelectValue placeholder="Todos os roles" />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/50">
                  <SelectItem value="all">Todos os roles</SelectItem>
                  <SelectItem value="CLIENT">Clientes</SelectItem>
                  <SelectItem value="BOOSTER">Boosters</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="submit"
                className="bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
                style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
              >
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : users.length === 0 ? (
          <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Tente ajustar os filtros de busca
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {users.map((adminUser) => {
              const roleInfo = getRoleBadge(adminUser.role)
              const RoleIcon = roleInfo.icon

              return (
                <Card
                  key={adminUser.id}
                  className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-lg font-bold text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {adminUser.name || adminUser.email}
                          </p>
                          <Badge
                            className={`${roleInfo.color} border font-rajdhani flex items-center gap-1`}
                            style={{ fontFamily: 'Rajdhani, sans-serif' }}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {roleInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {adminUser.email}
                        </p>
                        <p className="text-xs text-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          Criado em {formatDate(adminUser.createdAt)} • {adminUser._count.orders} pedidos
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 font-rajdhani"
                          style={{ fontFamily: 'Rajdhani, sans-serif' }}
                        >
                          <Link href={`/admin/users/${adminUser.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </Button>
                        {adminUser.id !== user.id && (
                          <>
                            <ActionButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteClick(adminUser.id, adminUser.email)}
                              icon={Trash2}
                            />
                            <ConfirmDialog
                              open={deleteDialogOpen && userToDelete?.id === adminUser.id}
                              onOpenChange={setDeleteDialogOpen}
                              title="Deletar Usuário"
                              description={`Tem certeza que deseja deletar o usuário ${adminUser.email}? Esta ação não pode ser desfeita.`}
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
            Total: {users.length} usuário{users.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

