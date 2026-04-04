'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ArrowLeft, Save, Pencil, X, Check, Percent } from 'lucide-react'
import Link from 'next/link'
import { showSuccess, showError } from '@/lib/toast'
import { formatPrice } from '@/lib/utils'

interface CommissionConfig {
  id: number
  boosterPercentage: number
  adminPercentage: number
  devAdminPercentage: number
  withdrawalWaitingDays: number
}

interface Booster {
  id: number
  name: string | null
  email: string
  image: string | null
  boosterCommissionPercentage: number | null
}

const PREVIEW_AMOUNT = 100

export default function AdminCommissionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { loading, withLoading } = useLoading({ initialLoading: true })

  // Config state
  const [config, setConfig] = useState<CommissionConfig | null>(null)
  const [devAdminInput, setDevAdminInput] = useState('')
  const [boosterInput, setBoosterInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [configAlert, setConfigAlert] = useState<{ title: string; description: string; variant: 'default' | 'destructive' } | null>(null)

  // Booster table state
  const [boosters, setBoosters] = useState<Booster[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingBooster, setSavingBooster] = useState<number | null>(null)

  const isDevAdmin = user?.isDevAdmin === true
  const canEdit = !isDevAdmin

  // ─── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
    else if (!authLoading && user && user.role !== 'ADMIN') {
      router.replace(user.role === 'BOOSTER' ? '/booster' : '/dashboard')
    }
  }, [user, authLoading, router])

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    withLoading(async () => {
      await Promise.all([fetchConfig(), fetchBoosters()])
    })
  }, [user])

  const fetchConfig = async () => {
    const response = await fetch('/api/admin/commission-config')
    if (response.ok) {
      const data = await response.json()
      setConfig(data.config)
      setDevAdminInput(String(Math.round(data.config.devAdminPercentage * 100)))
      setBoosterInput(String(Math.round(data.config.boosterPercentage * 100)))
    }
  }

  const fetchBoosters = async () => {
    const response = await fetch('/api/admin/users?role=BOOSTER&limit=100')
    if (response.ok) {
      const data = await response.json()
      setBoosters(data.users || [])
    }
  }

  // ─── Derived preview values ────────────────────────────────────────────────
  const devPct = parseFloat(devAdminInput) || 0
  const boosterPct = parseFloat(boosterInput) || 0
  const adminPct = 100 - boosterPct
  const remaining = PREVIEW_AMOUNT * (1 - devPct / 100)
  const previewDev = PREVIEW_AMOUNT * (devPct / 100)
  const previewBooster = remaining * (boosterPct / 100)
  const previewAdmin = remaining * (adminPct / 100)

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    setConfigAlert(null)
    const dev = parseFloat(devAdminInput)
    const booster = parseFloat(boosterInput)

    if (isNaN(dev) || isNaN(booster)) {
      setConfigAlert({ title: 'Erro', description: 'Porcentagens devem ser números válidos', variant: 'destructive' })
      return
    }
    if (dev < 0 || dev > 100 || booster < 0 || booster > 100) {
      setConfigAlert({ title: 'Erro', description: 'Porcentagens devem estar entre 0 e 100', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/commission-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boosterPercentage: booster / 100,
          devAdminPercentage: dev / 100,
          withdrawalWaitingDays: config?.withdrawalWaitingDays ?? 7,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setConfig(data.config)
        showSuccess('Configuração salva com sucesso!')
      } else {
        setConfigAlert({ title: 'Erro', description: data.message || 'Erro ao salvar', variant: 'destructive' })
      }
    } catch {
      showError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (booster: Booster) => {
    setEditingId(booster.id)
    const current = booster.boosterCommissionPercentage
    setEditValue(current !== null && current !== undefined ? String(Math.round(current * 100)) : '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveBoosterOverride = async (boosterId: number) => {
    setSavingBooster(boosterId)
    const value = editValue.trim()
    const percentage = value === '' ? null : parseFloat(value) / 100

    if (percentage !== null && (isNaN(percentage) || percentage < 0 || percentage > 1)) {
      showError('Porcentagem deve estar entre 0 e 100')
      setSavingBooster(null)
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${boosterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boosterCommissionPercentage: percentage }),
      })
      const data = await response.json()
      if (response.ok) {
        setBoosters(prev => prev.map(b =>
          b.id === boosterId ? { ...b, boosterCommissionPercentage: percentage } : b
        ))
        setEditingId(null)
        showSuccess(percentage === null ? 'Override removido — usando padrão global' : 'Porcentagem atualizada')
      } else {
        showError(data.message || 'Erro ao atualizar')
      }
    } catch {
      showError('Erro de conexão')
    } finally {
      setSavingBooster(null)
    }
  }

  const getBoosterPct = (booster: Booster) => {
    if (booster.boosterCommissionPercentage !== null && booster.boosterCommissionPercentage !== undefined) {
      return booster.boosterCommissionPercentage
    }
    return config ? config.boosterPercentage : 0.25
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="text-brand-purple-light hover:text-brand-purple-light mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Dashboard
            </Button>
          </Link>
        </div>

        <PageHeader
          highlight="COMISSÕES"
          title="GERENCIAR"
          description="Configure as porcentagens de comissão. Mudanças afetam apenas pedidos futuros."
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-8">

            {/* ── Block 1: Global Config ──────────────────────────────────── */}
            <Card className="bg-brand-black-light border-brand-purple/20">
              <CardHeader>
                <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Configuração Global
                </CardTitle>
                <CardDescription className="text-brand-gray-500 font-rajdhani">
                  {canEdit ? 'Define os padrões para todos os boosters sem override individual.' : 'Visualização somente leitura.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`grid grid-cols-1 gap-4 ${isDevAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {isDevAdmin && (
                    <div className="space-y-2">
                      <Label className="text-brand-gray-300 font-rajdhani">% Dev-Admin (off-the-top)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={devAdminInput}
                          onChange={e => setDevAdminInput(e.target.value)}
                          disabled={!canEdit}
                          className="bg-brand-black-light border-brand-purple/20 focus:border-brand-purple text-white"
                        />
                        <Percent className="h-4 w-4 text-brand-gray-500 flex-shrink-0" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-brand-gray-300 font-rajdhani">% Booster padrão</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={boosterInput}
                        onChange={e => setBoosterInput(e.target.value)}
                        disabled={!canEdit}
                        className="bg-brand-black-light border-brand-purple/20 focus:border-brand-purple text-white"
                      />
                      <Percent className="h-4 w-4 text-brand-gray-500 flex-shrink-0" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-brand-gray-300 font-rajdhani">% Admin (automático)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={isNaN(adminPct) ? '' : adminPct.toFixed(0)}
                        disabled
                        className="bg-brand-black/30 border-brand-purple/20 text-brand-gray-500 cursor-not-allowed"
                      />
                      <Percent className="h-4 w-4 text-brand-gray-500 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-brand-gray-500">= 100% − % Booster</p>
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded-lg bg-brand-black/30 border border-brand-purple/20 p-4">
                  <p className="text-brand-gray-300 font-rajdhani text-sm mb-3">
                    Simulação em {formatPrice(PREVIEW_AMOUNT)}:
                  </p>
                  <div className={`grid gap-3 text-center ${isDevAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {isDevAdmin && (
                      <div>
                        <p className="text-xs text-brand-gray-500 font-rajdhani">Dev-Admin</p>
                        <p className="text-white font-orbitron font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {formatPrice(previewDev)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-brand-gray-500 font-rajdhani">Booster</p>
                      <p className="text-white font-orbitron font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {formatPrice(previewBooster)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-gray-500 font-rajdhani">Admin</p>
                      <p className="text-white font-orbitron font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {formatPrice(previewAdmin)}
                      </p>
                    </div>
                  </div>
                </div>

                {configAlert && (
                  <Alert variant={configAlert.variant}>
                    <AlertTitle>{configAlert.title}</AlertTitle>
                    <AlertDescription>{configAlert.description}</AlertDescription>
                  </Alert>
                )}

                {canEdit && (
                  <Button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="bg-brand-purple hover:bg-brand-purple-light text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Configuração'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* ── Block 2: Booster Table ──────────────────────────────────── */}
            <Card className="bg-brand-black-light border-brand-purple/20">
              <CardHeader>
                <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Boosters
                </CardTitle>
                <CardDescription className="text-brand-gray-500 font-rajdhani">
                  Overrides individuais. Deixe em branco para usar o padrão global.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {boosters.length === 0 ? (
                  <p className="text-brand-gray-500 font-rajdhani text-center py-8">Nenhum booster ativo encontrado.</p>
                ) : (
                  <div className="space-y-3">
                    {boosters.map(booster => {
                      const pct = getBoosterPct(booster)
                      const adminResultante = 100 - Math.round(pct * 100)
                      const hasOverride = booster.boosterCommissionPercentage !== null && booster.boosterCommissionPercentage !== undefined
                      const isEditing = editingId === booster.id

                      return (
                        <div
                          key={booster.id}
                          className="flex items-center gap-4 p-3 rounded-lg border border-brand-purple/20 bg-brand-black/30 hover:border-brand-purple transition-colors"
                        >
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage src={booster.image || ''} />
                            <AvatarFallback className="bg-brand-purple-dark text-white text-xs">
                              {booster.name?.substring(0, 2).toUpperCase() || 'BO'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="text-white font-rajdhani font-medium truncate">
                              {booster.name || booster.email}
                            </p>
                            <p className="text-brand-gray-500 text-xs font-rajdhani truncate">{booster.email}</p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder={`padrão (${Math.round((config?.boosterPercentage ?? 0.25) * 100)}%)`}
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  className="w-28 bg-brand-black-light border-brand-purple text-white h-8 text-sm"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => saveBoosterOverride(booster.id)}
                                  disabled={savingBooster === booster.id}
                                  className="bg-brand-purple hover:bg-brand-purple-light text-white h-8 w-8 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEdit}
                                  className="text-brand-gray-500 hover:text-white h-8 w-8 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="text-right">
                                  <div className="flex items-center gap-1">
                                    <span className="text-white font-orbitron text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                      {Math.round(pct * 100)}%
                                    </span>
                                    {hasOverride && (
                                      <Badge className="text-[10px] bg-brand-purple/20 text-brand-purple-light border-brand-purple/30 py-0">
                                        override
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-brand-gray-500 text-xs font-rajdhani">admin: {adminResultante}%</p>
                                </div>
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEdit(booster)}
                                    className="text-brand-gray-500 hover:text-white h-8 w-8 p-0"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  )
}
