'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlowCard } from '@/components/common/glow-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { showSuccess, showError } from '@/lib/toast'
import {
  User as UserIcon,
  Mail,
  Phone,
  Save,
  Lock,
  CreditCard,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { formatDate } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { SkeletonProfileForm } from '@/components/common/skeletons'
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
} from "@/components/ui/alert-dialog"

interface UserProfile {
  id: number
  email: string
  name: string | null
  role: string
  phone: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    orders?: number
    boosterOrders?: number
  }
}

export default function ProfilePage() {
  const { user: authUser, loading: authLoading, refreshUser, logout } = useAuth()
  const router = useRouter()
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const fetchProfile = useCallback(async () => {
    await withLoading(async () => {
      try {
        const data = await api.get<{ user: NonNullable<typeof profile> }>('/api/user/profile')
        setProfile(data.user)
        setName(data.user.name || '')
        setPhone(data.user.phone || '')
      } catch {
        showError('Erro', 'Não foi possível carregar o perfil')
      }

      // Buscar chave PIX se for booster ou admin
      if (authUser && (authUser.role === 'BOOSTER' || authUser.role === 'ADMIN')) {
        try {
          const pixData = await api.get<{ pixKey?: string }>('/api/user/bank-account')
          setPixKey(pixData.pixKey || '')
        } catch (error) {
          console.error('Erro ao buscar chave PIX:', error)
        }
      }
    })
  }, [withLoading, authUser])

  useEffect(() => {
    if (!authLoading && !authUser) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/login')
    } else if (authUser) {
      fetchProfile()
    }
  }, [authUser, authLoading, router, fetchProfile])

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validações
      if (newPassword && newPassword !== confirmPassword) {
        showError('Erro', 'As senhas não coincidem')
        return
      }

      if (newPassword && newPassword.length < 6) {
        showError('Erro', 'A nova senha deve ter no mínimo 6 caracteres')
        return
      }

      const body: Record<string, unknown> = {}
      if (name.trim() !== '') body.name = name.trim()
      if (phone.trim() !== '') body.phone = phone.trim()

      if (newPassword) {
        if (!currentPassword) {
          showError('Erro', 'Informe sua senha atual para alterar a senha')
          return
        }
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }

      // Atualizar perfil
      const data = await api.put<{ user: NonNullable<typeof profile> }>('/api/user/profile', body)

      // Atualizar chave PIX se for booster ou admin
      if (authUser && (authUser.role === 'BOOSTER' || authUser.role === 'ADMIN')) {
        await api.put('/api/user/bank-account', { pixKey })
      }

      showSuccess('Perfil atualizado com sucesso!')
      
      // Limpar campos de senha
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Atualizar perfil local
      setProfile(data.user)
      
      // Atualizar contexto de autenticação
      await refreshUser()
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      showError('Erro', error instanceof Error ? error.message : 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }


  const handleDeleteAccount = async () => {
    try {
      setSaving(true)

      await api.delete('/api/user/delete')

      // Logout and redirect
      logout()
      router.replace('/login?deleted=true')

    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      showError('Erro ao excluir conta', error instanceof Error ? error.message : 'Não foi possível excluir sua conta. Verifique se não há pedidos em andamento.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!authUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-5xl xl:max-w-6xl mx-auto">
        <PageHeader
          highlight="MEU"
          title="PERFIL"
          description="Gerencie suas informações pessoais e configurações da conta"
        />

        {loading ? (
          <SkeletonProfileForm />
        ) : !profile ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-rajdhani">
              Erro ao carregar perfil
            </p>
          </div>
        ) : (
          <>

        <div className="grid gap-6">
          {/* Informações da Conta */}
          <GlowCard className="hover:shadow-xl hover:shadow-brand-purple/20">
            <CardHeader className="relative z-10">
              <CardTitle className="text-foreground flex items-center gap-2 group-hover:text-brand-purple-light transition-colors duration-300">
                <div className="p-2 rounded-lg bg-brand-purple/20 group-hover:bg-brand-purple/30 transition-colors duration-300">
                  <UserIcon className="h-5 w-5 text-brand-purple-light group-hover:scale-110 transition-transform duration-300" />
                </div>
                Informações da Conta
              </CardTitle>
              <CardDescription className="text-muted-foreground group-hover:text-muted-foreground transition-colors duration-300">
                Visualize e edite suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Nome
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50 border-brand-purple/50 text-foreground"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-background/30 border-brand-purple/30 text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-background/50 border-brand-purple/50 text-foreground"
                />
              </div>

              {/* Chave PIX (apenas para BOOSTER e ADMIN) */}
              {authUser && (authUser.role === 'BOOSTER' || authUser.role === 'ADMIN') && (
                <div className="space-y-2">
                  <Label htmlFor="pixKey" className="text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Chave PIX
                  </Label>
                  <Input
                    id="pixKey"
                    type="text"
                    placeholder="email@exemplo.com ou CPF/CNPJ ou telefone"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="bg-background/50 border-brand-purple/50 text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Chave PIX para recebimento de pagamentos</p>
                </div>
              )}

              {/* Informações adicionais */}
              <Separator className="bg-brand-purple/30" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Função</p>
                  <p className="text-foreground font-semibold capitalize">
                    {profile.role === 'CLIENT' ? 'Cliente' : 
                     profile.role === 'BOOSTER' ? 'Booster' : 
                     'Administrador'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Conta criada em</p>
                  <p className="text-foreground">{formatDate(profile.createdAt)}</p>
                </div>
                {profile._count && (
                  <>
                    {profile._count.orders !== undefined && (
                      <div>
                        <p className="text-muted-foreground mb-1">Pedidos realizados</p>
                        <p className="text-foreground font-semibold">{profile._count.orders}</p>
                      </div>
                    )}
                    {profile._count.boosterOrders !== undefined && (
                      <div>
                        <p className="text-muted-foreground mb-1">Trabalhos como booster</p>
                        <p className="text-foreground font-semibold">{profile._count.boosterOrders}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </GlowCard>

          {/* Alterar Senha */}
          <GlowCard className="hover:shadow-xl hover:shadow-brand-purple/20">
            <CardHeader className="relative z-10">
              <CardTitle className="text-foreground flex items-center gap-2 group-hover:text-brand-purple-light transition-colors duration-300">
                <div className="p-2 rounded-lg bg-brand-purple/20 group-hover:bg-brand-purple/30 transition-colors duration-300">
                  <Lock className="h-5 w-5 text-brand-purple-light group-hover:scale-110 transition-transform duration-300" />
                </div>
                Alterar Senha
              </CardTitle>
              <CardDescription className="text-muted-foreground group-hover:text-muted-foreground transition-colors duration-300">
                Deixe em branco se não deseja alterar sua senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-muted-foreground">
                  Senha Atual
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-background/50 border-brand-purple/50 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-muted-foreground">
                  Nova Senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite sua nova senha (mín. 6 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background/50 border-brand-purple/50 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-muted-foreground">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background/50 border-brand-purple/50 text-foreground"
                />
              </div>
            </CardContent>
          </GlowCard>

          {/* Botão Salvar */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-2 border-brand-purple/50 text-foreground hover:border-white/50 transition-all duration-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-brand-purple to-brand-purple-light text-white shadow-lg border border-transparent hover:border-white/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
          
          {/* Zona de Perigo / Excluir Conta */}
          <Card className="group relative bg-brand-red/5 border-brand-red/30 backdrop-blur-md hover:border-brand-red/50 hover:shadow-xl hover:shadow-brand-red/10 transition-colors duration-200 overflow-hidden mt-8">
            <CardHeader className="relative z-10">
              <CardTitle className="text-brand-red flex items-center gap-2">
                <div className="p-2 rounded-lg bg-brand-red/10 group-hover:bg-brand-red/20 transition-colors duration-300">
                  <AlertTriangle className="h-5 w-5 text-brand-red" />
                </div>
                Zona de Perigo
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Ações irreversíveis para sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-foreground font-medium mb-1">Excluir Conta</h4>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Ao excluir sua conta, seus dados pessoais serão anonimizados e você perderá acesso ao histórico. Esta ação não pode ser desfeita.
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="bg-brand-red/10 text-brand-red border border-brand-red/50 hover:bg-brand-red hover:text-white transition-all">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Minha Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background border-brand-purple/20">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground font-orbitron">Tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Esta ação não pode ser desfeita. Isso irá anonimizar permanentemente seus dados pessoais e remover seu acesso à conta.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent text-foreground border-brand-purple/50 hover:bg-brand-purple/10 hover:text-foreground">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-brand-red hover:bg-brand-red/80 text-white border-none"
                      >
                        Sim, excluir minha conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          </>
        )}
      </div>
    </div>
  )
}

