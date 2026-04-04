'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Save, User, Crown, Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface UserDetail {
  id: number
  email: string
  name?: string | null
  role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
  boosterCommissionPercentage?: number | null
  adminProfitShare?: number | null
  createdAt: string
  updatedAt: string
  _count: { orders: number }
}

const ROLE_CONFIG = {
  ADMIN:   { label: 'Admin',   color: 'bg-red-500/20 text-red-300 border-red-500/50',     icon: Crown  },
  BOOSTER: { label: 'Booster', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50',  icon: Shield },
  CLIENT:  { label: 'Cliente', color: 'bg-green-500/20 text-green-300 border-green-500/50', icon: User  },
}

export default function AdminUserDetailPage() {
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [userData, setUserData] = useState<UserDetail | null>(null)
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'CLIENT' | 'BOOSTER' | 'ADMIN'>('CLIENT')
  const [password, setPassword] = useState('')
  const [commissionPct, setCommissionPct] = useState('')
  const [profitShare, setProfitShare] = useState('')

  useEffect(() => {
    if (!authLoading && (!authUser || authUser.role !== 'ADMIN')) {
      router.replace(!authUser ? '/login' : authUser.role === 'BOOSTER' ? '/booster' : '/dashboard')
    } else if (authUser?.role === 'ADMIN') {
      fetchUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, authLoading])

  const fetchUser = async () => {
    await withLoading(async () => {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        const u: UserDetail = data.user
        setUserData(u)
        setName(u.name || '')
        setEmail(u.email)
        setRole(u.role)
        setCommissionPct(
          u.boosterCommissionPercentage != null
            ? (u.boosterCommissionPercentage * 100).toString()
            : '70'
        )
        setProfitShare(u.adminProfitShare != null ? u.adminProfitShare.toString() : '0')
      } else {
        showAlert('Erro', 'Usuário não encontrado', 'destructive')
        router.replace('/admin/users')
      }
    })
  }

  const showAlert = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    setAlert({ title, description, variant })
    setTimeout(() => setAlert(null), 5000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { name, email, role }
      if (password.length >= 6) body.password = password

      if (role === 'BOOSTER') {
        const pct = parseFloat(commissionPct) / 100
        if (isNaN(pct) || pct < 0 || pct > 1) {
          showAlert('Erro', 'Comissão deve ser um número entre 0 e 100', 'destructive')
          setSaving(false)
          return
        }
        body.boosterCommissionPercentage = pct
      }

      if (role === 'ADMIN') {
        const share = parseFloat(profitShare)
        if (isNaN(share) || share < 0) {
          showAlert('Erro', 'Profit share deve ser um número positivo', 'destructive')
          setSaving(false)
          return
        }
        body.adminProfitShare = share
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        showAlert('Sucesso', 'Usuário atualizado com sucesso!')
        fetchUser()
        setPassword('')
      } else {
        const data = await res.json()
        showAlert('Erro', data.message || 'Erro ao atualizar usuário', 'destructive')
      }
    } catch {
      showAlert('Erro', 'Erro ao atualizar usuário', 'destructive')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <LoadingSpinner />
  if (!authUser || authUser.role !== 'ADMIN') return null

  const roleInfo = userData ? ROLE_CONFIG[userData.role] : null
  const RoleIcon = roleInfo?.icon || User

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center text-brand-purple-light hover:text-brand-purple transition-colors font-rajdhani mb-6"
        style={{ fontFamily: 'Rajdhani, sans-serif' }}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Usuários
      </Link>

      {alert && (
        <Alert variant={alert.variant} className="mb-6">
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}

      {userData && (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-purple/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-brand-purple-light">
                {(userData.name?.[0] || userData.email[0]).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {userData.name || userData.email}
                </h1>
                {roleInfo && (
                  <Badge className={cn('border font-rajdhani flex items-center gap-1', roleInfo.color)}>
                    <RoleIcon className="h-3 w-3" />
                    {roleInfo.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-brand-gray-500 font-rajdhani">
                ID #{userData.id} · {userData._count.orders} pedidos · Desde {formatDate(userData.createdAt)}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
            <CardHeader>
              <CardTitle className="text-white font-orbitron text-base" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Editar Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-brand-gray-300 font-rajdhani">Nome</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-brand-black/50 border-brand-purple/50 text-white font-rajdhani"
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-brand-gray-300 font-rajdhani">Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-brand-black/50 border-brand-purple/50 text-white font-rajdhani"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-brand-gray-300 font-rajdhani">Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                    <SelectTrigger className="bg-brand-black/50 border-brand-purple/50 text-white font-rajdhani">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-black border-brand-purple/50">
                      <SelectItem value="CLIENT">Cliente</SelectItem>
                      <SelectItem value="BOOSTER">Booster</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-brand-gray-300 font-rajdhani">Nova Senha <span className="text-brand-gray-500">(opcional)</span></Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-brand-black/50 border-brand-purple/50 text-white font-rajdhani"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              {role === 'BOOSTER' && (
                <div className="space-y-1.5">
                  <Label className="text-brand-gray-300 font-rajdhani">Comissão (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(e.target.value)}
                    className="bg-brand-black/50 border-brand-purple/50 text-white font-rajdhani"
                    placeholder="70"
                  />
                  <p className="text-xs text-brand-gray-500 font-rajdhani">Padrão global: 70%</p>
                </div>
              )}

              {role === 'ADMIN' && (
                <div className="space-y-1.5">
                  <Label className="text-brand-gray-300 font-rajdhani">Profit Share</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={profitShare}
                    onChange={(e) => setProfitShare(e.target.value)}
                    className="bg-brand-black/50 border-brand-purple/50 text-white font-rajdhani"
                    placeholder="1.0"
                  />
                  <p className="text-xs text-brand-gray-500 font-rajdhani">Peso relativo na divisão de lucro. 1.0 = divisão igualitária.</p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-brand-purple hover:bg-brand-purple-light text-white font-rajdhani border border-transparent hover:border-white/20"
                  style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
