'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent } from '@/components/ui/card'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { showSuccess, showError } from '@/lib/toast'
import { api, ApiError } from '@/lib/api-client'
import {
  Users,
  Search,
  Edit,
  Trash2,
  Loader2,
  Shield,
  User,
  Crown,
  DollarSign,
  History,
  CircleSlash,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { SkeletonUserList } from '@/components/common/skeletons'
import { LoadingSwap } from '@/components/common/loading-swap'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { AdminPageShell } from '@/components/common/admin-page-shell'
import { formatDate } from '@/lib/utils'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PaginationControls } from '@/components/common/pagination-controls'
import { useDebounce } from '@/hooks/use-debounce'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const PAGE_SIZE = 20

interface AdminUser {
  id: number
  email: string
  name?: string
  role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
  active: boolean
  boosterCommissionPercentage?: number | null
  adminProfitShare?: number | null
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
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const debouncedSearch = useDebounce(searchTerm, 400)
  const firstLoad = useRef(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: number; email: string } | null>(null)
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false)
  const [profitShareDialogOpen, setProfitShareDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [commissionPercentage, setCommissionPercentage] = useState<string>('')
  const [profitShareValue, setProfitShareValue] = useState<string>('')
  const [commissionReason, setCommissionReason] = useState<string>('')
  const [roleChange, setRoleChange] = useState<{ user: AdminUser; toRole: 'BOOSTER' | 'CLIENT' } | null>(null)

  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      await withLoading(async () => {
        // Filtragem (role + busca) e paginação são feitas no servidor — a busca
        // é debounced para não disparar uma requisição a cada tecla.
        const params = new URLSearchParams()
        if (filterRole) params.append('role', filterRole)
        const term = debouncedSearch.trim()
        if (term) params.append('search', term)
        params.append('limit', String(PAGE_SIZE))
        params.append('offset', String((page - 1) * PAGE_SIZE))

        const data = await api.get<{ users: AdminUser[]; pagination: { total: number } }>(
          `/api/admin/users?${params.toString()}`
        )
        setUsers(data.users || [])
        setTotal(data.pagination?.total ?? 0)
      }, isRefresh)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      showError('Erro ao buscar usuários', 'Tente novamente.')
    }
  }, [withLoading, filterRole, debouncedSearch, page])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.replace(!user ? '/login' : user.role === 'BOOSTER' ? '/booster' : '/dashboard')
    }
    // user?.id basta como gatilho — não re-rodar a cada recriação do objeto user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, router])

  // Busca os dados no primeiro load e sempre que filtros/página mudarem
  // (fetchUsers muda de identidade quando role/busca/página mudam).
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchUsers(!firstLoad.current)
      firstLoad.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fetchUsers])

  const handleDeleteClick = (userId: number, userEmail: string) => {
    setUserToDelete({ id: userId, email: userEmail })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    try {
      await api.delete(`/api/admin/users/${userToDelete.id}`)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      showSuccess('Usuário deletado com sucesso!')
      fetchUsers(true)
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      showError('Erro ao deletar usuário', error instanceof ApiError ? error.message : 'Tente novamente.')
    }
  }

  const handleRoleChange = async () => {
    if (!roleChange) return
    try {
      await api.put(`/api/admin/users/${roleChange.user.id}`, { role: roleChange.toRole })
      showSuccess(
        roleChange.toRole === 'BOOSTER'
          ? 'Usuário promovido a Booster!'
          : 'Usuário rebaixado para Cliente!'
      )
      setRoleChange(null)
      fetchUsers(true)
    } catch (error) {
      console.error('Erro ao alterar cargo:', error)
      showError('Erro ao alterar cargo', error instanceof ApiError ? error.message : 'Tente novamente.')
    }
  }

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { label: string; color: string; icon: LucideIcon }> = {
      ADMIN: {
        label: 'Admin',
        color: 'bg-red-500/20 text-foreground dark:text-red-300 border-red-500/50',
        icon: Crown,
      },
      BOOSTER: {
        label: 'Booster',
        color: 'bg-blue-500/20 text-foreground dark:text-blue-300 border-blue-500/50',
        icon: Shield,
      },
      CLIENT: {
        label: 'Cliente',
        color: 'bg-green-500/20 text-foreground dark:text-green-300 border-green-500/50',
        icon: User,
      },
    }
    return configs[role] || configs.CLIENT
  }


  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <AdminPageShell
      highlight="GERENCIAR"
      title="USUÁRIOS"
      description="Visualize e gerencie todos os usuários da plataforma"
    >
        {refreshing && (
          <div className="mb-4 p-2 bg-brand-purple/10 border border-brand-purple/30 rounded-lg">
            <p className="text-sm text-brand-purple-light font-rajdhani text-center">
              <Loader2 className="h-4 w-4 inline-block mr-2 animate-spin" />
              Atualizando…
            </p>
          </div>
        )}
        {/* Filtros e Busca */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por email ou nome…"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                    className="pl-10 bg-background/50 border-brand-purple/50 text-foreground font-rajdhani"
                  />
                </div>
              </div>
              <Select
                value={filterRole || undefined}
                onValueChange={(value) => {
                  setFilterRole(value === 'all' ? '' : value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full md:w-52 bg-background/50 border-brand-purple/50 text-foreground font-rajdhani">
                  <SelectValue placeholder="Todos os roles" />
                </SelectTrigger>
                <SelectContent className="bg-background border-brand-purple/50">
                  <SelectItem value="all">Todos os roles</SelectItem>
                  <SelectItem value="CLIENT">Clientes</SelectItem>
                  <SelectItem value="BOOSTER">Boosters</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <LoadingSwap loading={loading} skeleton={<SkeletonUserList count={8} />}>
          {users.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground font-orbitron mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-muted-foreground font-rajdhani">
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
                  className="hover:border-brand-purple/50 transition-colors"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-lg font-bold text-foreground font-rajdhani">
                            {adminUser.name || adminUser.email}
                          </p>
                          <Badge
                            className={`${roleInfo.color} border font-rajdhani flex items-center gap-1`}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {roleInfo.label}
                          </Badge>
                          {!adminUser.active && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="bg-amber-500/20 text-foreground dark:text-amber-300 border-amber-500/50 border font-rajdhani flex items-center gap-1 cursor-help">
                                    <CircleSlash className="h-3 w-3" />
                                    E-mail não confirmado
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs font-rajdhani">
                                  O usuário ainda não confirmou o e-mail com o código de verificação, então a conta segue inativa.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-rajdhani mb-1">
                          {adminUser.email}
                        </p>
                        <p className="text-xs text-muted-foreground font-rajdhani">
                          Criado em {formatDate(adminUser.createdAt)} • {adminUser._count.orders} pedidos
                        </p>
                        {adminUser.role === 'BOOSTER' && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground font-rajdhani">
                              Comissão: {adminUser.boosterCommissionPercentage !== null && adminUser.boosterCommissionPercentage !== undefined
                                ? `${(adminUser.boosterCommissionPercentage * 100).toFixed(0)}%`
                                : 'Padrão (70%)'}
                            </p>
                          </div>
                        )}
                        {adminUser.role === 'ADMIN' && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground font-rajdhani">
                              Share de Lucro: {adminUser.adminProfitShare !== null && adminUser.adminProfitShare !== undefined
                                ? adminUser.adminProfitShare
                                : '0 (Divisão igualitária)'}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {adminUser.role === 'BOOSTER' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-500/50 text-foreground dark:text-green-300 hover:bg-green-500/10 font-rajdhani"
                              onClick={() => {
                                setSelectedUser(adminUser)
                                setCommissionPercentage(
                                  adminUser.boosterCommissionPercentage !== null && adminUser.boosterCommissionPercentage !== undefined
                                    ? (adminUser.boosterCommissionPercentage * 100).toString()
                                    : '70'
                                )
                                setCommissionReason('')
                                setCommissionDialogOpen(true)
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Comissão
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-500/50 text-foreground dark:text-blue-300 hover:bg-blue-500/10 font-rajdhani hidden"
                            >
                              <History className="h-4 w-4 mr-2" />
                              Histórico
                            </Button>
                          </>
                        )}
                        {adminUser.role === 'ADMIN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-yellow-500/50 text-foreground dark:text-yellow-300 hover:bg-yellow-500/10 font-rajdhani"
                            onClick={() => {
                              setSelectedUser(adminUser)
                              setProfitShareValue(
                                adminUser.adminProfitShare !== null && adminUser.adminProfitShare !== undefined
                                  ? adminUser.adminProfitShare.toString()
                                  : '0'
                              )
                              setProfitShareDialogOpen(true)
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Profit Share
                          </Button>
                        )}
                        {adminUser.role === 'CLIENT' && adminUser.active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-500/50 text-foreground dark:text-blue-300 hover:bg-blue-500/10 font-rajdhani"
                            onClick={() => setRoleChange({ user: adminUser, toRole: 'BOOSTER' })}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Promover a Booster
                          </Button>
                        )}
                        {adminUser.role === 'BOOSTER' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-orange-500/50 text-foreground dark:text-orange-300 hover:bg-orange-500/10 font-rajdhani"
                            onClick={() => setRoleChange({ user: adminUser, toRole: 'CLIENT' })}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Rebaixar
                          </Button>
                        )}
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-brand-purple/50 text-brand-purple-light hover:bg-brand-purple/10 font-rajdhani"
                        >
                          <Link href={`/admin/users/${adminUser.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </Button>
                        {adminUser.id !== user.id && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/50 text-foreground dark:text-red-300 hover:bg-red-500/10 font-rajdhani"
                              onClick={() => handleDeleteClick(adminUser.id, adminUser.email)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deletar
                            </Button>
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
        </LoadingSwap>

        <PaginationControls
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          itemLabel="usuário"
        />

      {/* Dialog de promover/rebaixar cargo */}
      <ConfirmDialog
        open={roleChange !== null}
        onOpenChange={(open) => { if (!open) setRoleChange(null) }}
        title={roleChange?.toRole === 'BOOSTER' ? 'Promover a Booster' : 'Rebaixar para Cliente'}
        description={
          roleChange?.toRole === 'BOOSTER'
            ? `Promover ${roleChange?.user.email} a Booster? O usuário poderá aceitar e realizar pedidos.`
            : `Rebaixar ${roleChange?.user.email} para Cliente? O usuário deixará de aceitar novos pedidos.`
        }
        confirmLabel={roleChange?.toRole === 'BOOSTER' ? 'Promover' : 'Rebaixar'}
        cancelLabel="Cancelar"
        onConfirm={handleRoleChange}
      />

      {/* Dialog para configurar comissão */}
      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent className="bg-background border-brand-purple/50">
          <DialogHeader>
            <DialogTitle className="text-foreground font-orbitron">
              Configurar Comissão
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-rajdhani">
              {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground font-rajdhani">
                Porcentagem de Comissão (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(e.target.value)}
                className="bg-background/50 border-brand-purple/50 text-foreground font-rajdhani mt-1"
                placeholder="70"
              />
              <p className="text-xs text-muted-foreground mt-1 font-rajdhani">
                Valor entre 0 e 100 (ex: 75 para 75%)
              </p>
            </div>
            <div>
              <Label className="text-foreground font-rajdhani">
                Motivo da Mudança (Opcional)
              </Label>
              <Textarea
                value={commissionReason}
                onChange={(e) => setCommissionReason(e.target.value)}
                className="bg-background/50 border-brand-purple/50 text-foreground font-rajdhani mt-1"
                placeholder="Ex: Ajuste por desempenho excepcional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCommissionDialogOpen(false)}
              className="border-brand-purple/50 text-brand-purple-light font-rajdhani"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  const percentage = parseFloat(commissionPercentage) / 100
                  if (isNaN(percentage) || percentage < 0 || percentage > 1) {
                    showError('Erro de validação', 'Porcentagem deve ser um número entre 0 e 100')
                    return
                  }

                  await api.put(`/api/admin/users/${selectedUser?.id}`, {
                    boosterCommissionPercentage: percentage,
                    reason: commissionReason || undefined,
                  })
                  showSuccess('Comissão atualizada com sucesso!')
                  setCommissionDialogOpen(false)
                  fetchUsers(false)
                } catch (error) {
                  console.error('Erro ao atualizar comissão:', error)
                  showError('Erro ao atualizar comissão', error instanceof ApiError ? error.message : 'Tente novamente.')
                }
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para configurar Profit Share (Admin) */}
      <Dialog open={profitShareDialogOpen} onOpenChange={setProfitShareDialogOpen}>
        <DialogContent className="bg-background border-brand-purple/50">
          <DialogHeader>
            <DialogTitle className="text-foreground font-orbitron">
              Configurar Profit Share
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-rajdhani">
              {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground font-rajdhani">
                Peso na Divisão de Lucro
              </Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={profitShareValue}
                onChange={(e) => setProfitShareValue(e.target.value)}
                className="bg-background/50 border-brand-purple/50 text-foreground font-rajdhani mt-1"
                placeholder="Ex: 1.0"
              />
              <p className="text-xs text-muted-foreground mt-1 font-rajdhani">
                Valor relativo para divisão do lucro (ex: 1.0, 0.5, 2.0).
                <br />
                Se todos tiverem 1.0, a divisão é igualitária.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProfitShareDialogOpen(false)}
              className="border-brand-purple/50 text-brand-purple-light font-rajdhani"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  const share = parseFloat(profitShareValue)
                  if (isNaN(share) || share < 0) {
                    showError('Erro de validação', 'O valor deve ser um número positivo')
                    return
                  }

                  await api.put(`/api/admin/users/${selectedUser?.id}`, {
                    adminProfitShare: share,
                  })
                  showSuccess('Profit Share atualizado com sucesso!')
                  setProfitShareDialogOpen(false)
                  fetchUsers(false)
                } catch (error) {
                  console.error('Erro ao atualizar Profit Share:', error)
                  showError('Erro ao atualizar Profit Share', error instanceof ApiError ? error.message : 'Tente novamente.')
                }
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminPageShell>
  )
}

