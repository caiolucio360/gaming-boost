'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  User as UserIcon,
  Mail,
  Phone,
  Save,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { formatDate } from '@/lib/utils'
import { ProfileSkeleton } from '@/components/common/loading-skeletons'

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
  const { user: authUser, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [alert, setAlert] = useState<{ 
    title: string
    description: string
    variant: 'default' | 'destructive'
  } | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!authLoading && !authUser) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/login')
    } else if (authUser) {
      fetchProfile()
    }
  }, [authUser, authLoading, router])

  const fetchProfile = async () => {
    await withLoading(async () => {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setName(data.user.name || '')
        setPhone(data.user.phone || '')
      } else {
        setAlert({
          title: 'Erro',
          description: 'Não foi possível carregar o perfil',
          variant: 'destructive',
        })
      }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setAlert(null)

      // Validações
      if (newPassword && newPassword !== confirmPassword) {
        setAlert({
          title: 'Erro',
          description: 'As senhas não coincidem',
          variant: 'destructive',
        })
        return
      }

      if (newPassword && newPassword.length < 6) {
        setAlert({
          title: 'Erro',
          description: 'A nova senha deve ter no mínimo 6 caracteres',
          variant: 'destructive',
        })
        return
      }

      const body: any = {}
      if (name.trim() !== '') body.name = name.trim()
      if (phone.trim() !== '') body.phone = phone.trim()

      if (newPassword) {
        if (!currentPassword) {
          setAlert({
            title: 'Erro',
            description: 'Informe sua senha atual para alterar a senha',
            variant: 'destructive',
          })
          return
        }
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        setAlert({
          title: 'Sucesso',
          description: 'Perfil atualizado com sucesso!',
          variant: 'default',
        })
        
        // Limpar campos de senha
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        // Atualizar perfil local
        setProfile(data.user)
        
        // Atualizar contexto de autenticação
        await refreshUser()
      } else {
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao atualizar perfil',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao salvar perfil',
        variant: 'destructive',
      })
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
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          highlight="MEU"
          title="PERFIL"
          description="Gerencie suas informações pessoais e configurações da conta"
        />

        {loading ? (
          <ProfileSkeleton />
        ) : !profile ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Erro ao carregar perfil
            </p>
          </div>
        ) : (
          <>

        {alert && (
          <Alert 
            variant={alert.variant} 
            className="mb-6"
          >
            {alert.variant === 'destructive' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Informações da Conta */}
          <Card className="bg-black/30 border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-purple-400" />
                Informações da Conta
              </CardTitle>
              <CardDescription className="text-gray-400">
                Visualize e edite suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-400 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Nome
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/50 border-purple-500/50 text-white"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-black/30 border-purple-500/30 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">O email não pode ser alterado</p>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-400 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-black/50 border-purple-500/50 text-white"
                />
              </div>

              {/* Informações adicionais */}
              <Separator className="bg-purple-500/30" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Função</p>
                  <p className="text-white font-semibold capitalize">
                    {profile.role === 'CLIENT' ? 'Cliente' : 
                     profile.role === 'BOOSTER' ? 'Booster' : 
                     'Administrador'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Conta criada em</p>
                  <p className="text-white">{formatDate(profile.createdAt)}</p>
                </div>
                {profile._count && (
                  <>
                    {profile._count.orders !== undefined && (
                      <div>
                        <p className="text-gray-400 mb-1">Pedidos realizados</p>
                        <p className="text-white font-semibold">{profile._count.orders}</p>
                      </div>
                    )}
                    {profile._count.boosterOrders !== undefined && (
                      <div>
                        <p className="text-gray-400 mb-1">Trabalhos como booster</p>
                        <p className="text-white font-semibold">{profile._count.boosterOrders}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card className="bg-black/30 border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-400" />
                Alterar Senha
              </CardTitle>
              <CardDescription className="text-gray-400">
                Deixe em branco se não deseja alterar sua senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-400">
                  Senha Atual
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-black/50 border-purple-500/50 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-400">
                  Nova Senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite sua nova senha (mín. 6 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-black/50 border-purple-500/50 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-400">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-black/50 border-purple-500/50 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-purple-500/50 text-white hover:bg-purple-500/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-500 hover:bg-purple-400 text-white"
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
          </>
        )}
      </div>
    </div>
  )
}

