'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { api, ApiError } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingSwap } from '@/components/common/loading-swap'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  AlertTriangle,
  Calculator,
  RefreshCw,
} from 'lucide-react'
import { AdminPageShell } from '@/components/common/admin-page-shell'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { showSuccess, showError } from '@/lib/toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

interface PricingConfig {
  id: number
  game: string
  gameMode: string
  serviceType: string
  rangeStart: number
  rangeEnd: number
  price: number
  unit?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface Gap {
  start: number
  end: number
}

/**
 * Loading silhouette for /admin/pricing content — the page header is rendered by
 * AdminPageShell, so the skeleton covers only the filters + form/table/right column.
 */
function PricingPageSkeleton() {
  return (
    <>
      {/* Filters card */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form card */}
          <Card>
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
              <Skeleton className="h-10 w-24 rounded-md" />
            </CardContent>
          </Card>

          {/* Table card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>
              <Skeleton className="h-9 w-9 rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default function PricingConfigPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [configs, setConfigs] = useState<PricingConfig[]>([])
  const [selectedGame, setSelectedGame] = useState<string>('CS2')
  const [selectedMode, setSelectedMode] = useState<string>('PREMIER')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('RANK_BOOST')
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [newlyAddedId, setNewlyAddedId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form fields
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [price, setPrice] = useState('')

  // Calculator preview
  const [calcCurrent, setCalcCurrent] = useState('')
  const [calcTarget, setCalcTarget] = useState('')
  const [calcResult, setCalcResult] = useState<number | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'ADMIN') {
      if (user.role === 'BOOSTER') {
        router.replace('/booster')
      } else if (user.role === 'CLIENT') {
        router.replace('/dashboard')
      } else {
        router.replace('/')
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchConfigs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedGame, selectedMode, selectedServiceType])

  // Gap Analysis
  const gaps = useMemo((): Gap[] => {
    const enabledConfigs = configs.filter(c => c.enabled).sort((a, b) => a.rangeStart - b.rangeStart)
    if (enabledConfigs.length === 0) return []

    const detectedGaps: Gap[] = []
    const minExpected = selectedServiceType === 'COACHING' ? 1 : selectedMode === 'PREMIER' ? 0 : 1
    const maxExpected = selectedServiceType === 'COACHING' ? 10 : 26000

    // Check if first range starts at expected minimum
    if (selectedServiceType !== 'COACHING' && enabledConfigs[0].rangeStart > minExpected) {
      detectedGaps.push({ start: minExpected, end: enabledConfigs[0].rangeStart - 1 })
    }

    // Check gaps between ranges
    for (let i = 0; i < enabledConfigs.length - 1; i++) {
      const currentEnd = enabledConfigs[i].rangeEnd
      const nextStart = enabledConfigs[i + 1].rangeStart
      if (nextStart > currentEnd + 1) {
        detectedGaps.push({ start: currentEnd + 1, end: nextStart - 1 })
      }
    }

    // Check if last range covers maximum
    const lastConfig = enabledConfigs[enabledConfigs.length - 1]
    if (selectedServiceType !== 'COACHING' && lastConfig.rangeEnd < maxExpected) {
      detectedGaps.push({ start: lastConfig.rangeEnd + 1, end: maxExpected })
    }

    return detectedGaps
  }, [configs, selectedMode, selectedServiceType])

  const fetchConfigs = async () => {
    await withLoading(async () => {
      try {
        const params = new URLSearchParams()
        if (selectedGame) params.append('game', selectedGame)
        if (selectedMode) params.append('gameMode', selectedMode)
        if (selectedServiceType) params.append('serviceType', selectedServiceType)

        const data = await api.get<{ data: typeof configs }>(`/api/admin/pricing?${params}`)
        setConfigs(data.data)
      } catch (error) {
        console.error('Erro ao buscar configurações:', error)
        showError('Erro', error instanceof ApiError ? error.message : 'Não foi possível carregar as configurações')
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rangeStart || !rangeEnd || !price) {
      showError('Erro', 'Por favor, preencha o valor inicial, valor final e o preço desta faixa.')
      return
    }

    setIsSaving(true)

    try {
      const body = {
        game: selectedGame,
        gameMode: selectedMode,
        serviceType: selectedServiceType,
        rangeStart: parseInt(rangeStart),
        rangeEnd: parseInt(rangeEnd),
        price: parseFloat(price),
        enabled: true,
      }

      const data = editingId
        ? await api.put<{ data?: { id?: number } }>(`/api/admin/pricing/${editingId}`, body)
        : await api.post<{ data?: { id?: number } }>('/api/admin/pricing', body)
      const wasEditing = !!editingId

      if (wasEditing) {
        // Update existing config in state
        setConfigs(prev => prev.map(c =>
          c.id === editingId ? { ...c, ...body, updatedAt: new Date().toISOString() } : c
        ))
        setNewlyAddedId(editingId)
      } else {
        // Add new config to state with animation
        const newConfig: PricingConfig = {
          ...body,
          id: data.data?.id || Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setConfigs(prev => [...prev, newConfig])
        setNewlyAddedId(newConfig.id)
      }

      showSuccess('Sucesso', wasEditing ? 'Configuração atualizada' : 'Configuração criada')
      resetForm()

      // Clear highlight after animation
      setTimeout(() => setNewlyAddedId(null), 2000)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showError('Erro', error instanceof ApiError ? error.message : 'Erro ao salvar configuração')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (config: PricingConfig) => {
    setEditingId(config.id)
    setIsEditing(true)
    setRangeStart(config.rangeStart.toString())
    setRangeEnd(config.rangeEnd.toString())
    setPrice(config.price.toString())

    // Scroll to form smoothly
    setTimeout(() => {
      document.getElementById('pricing-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    const idToDelete = deleteId
    setDeleteId(null) // Close dialog immediately
    setDeletingId(idToDelete) // Start animation

    try {
      await api.delete(`/api/admin/pricing/${idToDelete}`)
      // Wait for animation to complete before removing from state
      setTimeout(() => {
        setConfigs(prev => prev.filter(c => c.id !== idToDelete))
        setDeletingId(null)
        showSuccess('Sucesso', 'Configuração deletada')
      }, 400) // Match animation duration
    } catch (error) {
      setDeletingId(null)
      console.error('Erro ao deletar:', error)
      showError('Erro', error instanceof ApiError ? error.message : 'Erro ao deletar configuração')
    }
  }

  const handleToggleEnabled = async (config: PricingConfig) => {
    // Optimistic update - immediately update UI
    const previousConfigs = [...configs]
    setConfigs(prev => prev.map(c =>
      c.id === config.id ? { ...c, enabled: !c.enabled } : c
    ))

    try {
      await api.patch(`/api/admin/pricing/${config.id}`, { enabled: !config.enabled })
      showSuccess('Sucesso', config.enabled ? 'Faixa desativada' : 'Faixa ativada')
    } catch (error) {
      // Revert on error
      setConfigs(previousConfigs)
      console.error('Erro ao alterar status:', error)
      showError('Erro', error instanceof ApiError ? error.message : 'Erro ao alterar status')
    }
  }

  const handleCalculatePreview = async () => {
    const isCoaching = selectedServiceType === 'COACHING'

    if (!calcCurrent || (!isCoaching && !calcTarget)) {
      showError('Erro', isCoaching ? 'Preencha o número de horas' : 'Preencha os valores atual e desejado')
      return
    }

    if (!isCoaching) {
      const current = parseInt(calcCurrent)
      const target = parseInt(calcTarget)
      if (current >= target) {
        showError('Erro', 'O valor atual deve ser menor que o desejado')
        return
      }
    }

    setIsCalculating(true)
    try {
      let body: Record<string, unknown>

      if (isCoaching) {
        body = {
          game: selectedGame,
          gameMode: selectedMode,
          serviceType: selectedServiceType,
          hours: parseInt(calcCurrent),
        }
      } else {
        const currentValue = parseInt(calcCurrent)
        const targetValue = parseInt(calcTarget)
        body = {
          game: selectedGame,
          gameMode: selectedMode,
          serviceType: selectedServiceType,
          current: currentValue,
          target: targetValue,
        }
      }

      const data = await api.post<{ data: { price: number } }>('/api/pricing/calculate', body)
      setCalcResult(data.data.price)
    } catch (error) {
      console.error('Erro ao calcular:', error)
      showError('Erro', error instanceof ApiError ? error.message : 'Erro ao calcular preço')
      setCalcResult(null)
    } finally {
      setIsCalculating(false)
    }
  }

  const resetForm = () => {
    setIsEditing(false)
    setEditingId(null)
    setRangeStart('')
    setRangeEnd('')
    setPrice('')
  }

  const formatRangeDisplay = (config: PricingConfig) => {
    if (selectedServiceType === 'COACHING') {
      return `${config.rangeStart}h - ${config.rangeEnd}h`
    }
    if (selectedMode === 'PREMIER') {
      return `${config.rangeStart.toLocaleString('pt-BR')} - ${config.rangeEnd.toLocaleString('pt-BR')}`
    }
    return `Nível ${config.rangeStart} - ${config.rangeEnd}`
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
      title="PREÇOS"
      description="Gerencie os preços de boost por faixas de rating ou níveis"
    >
      <LoadingSwap loading={loading} skeleton={<PricingPageSkeleton />}>
        <>
        {/* Filtros */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground font-orbitron text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Jogo</Label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="CS2">Counter-Strike 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Modo de Jogo</Label>
                <Select value={selectedMode} onValueChange={(value) => {
                  setSelectedMode(value)
                  setCalcCurrent('')
                  setCalcTarget('')
                  setCalcResult(null)
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="PREMIER">Premier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Tipo de Serviço</Label>
                <Select value={selectedServiceType} onValueChange={(value) => {
                  setSelectedServiceType(value)
                  setCalcCurrent('')
                  setCalcTarget('')
                  setCalcResult(null)
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="RANK_BOOST">Boost</SelectItem>
                    <SelectItem value="DUO_BOOST">Duo Boost</SelectItem>
                    <SelectItem value="COACHING">Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gap Analysis Warning */}
        {gaps.length > 0 && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-orbitron">Atenção: Faixas de preço com lacunas</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                As seguintes faixas não possuem preço configurado e causarão erro no cálculo:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {gaps.map((gap, i) => (
                  <li key={i}>
                    {selectedServiceType === 'COACHING'
                      ? `${gap.start}h - ${gap.end}h`
                      : selectedMode === 'PREMIER'
                        ? `${gap.start.toLocaleString('pt-BR')} - ${gap.end.toLocaleString('pt-BR')}`
                        : `Níveis ${gap.start} - ${gap.end}`}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form + Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulário */}
            <Card
              id="pricing-form"
              className={`bg-card transition-all duration-300 ${
                isEditing
                  ? 'border-brand-purple/50 ring-1 ring-brand-purple/20 shadow-lg shadow-brand-purple/10'
                  : 'border-border'
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    isEditing
                      ? 'bg-brand-purple/20 border border-brand-purple/30'
                      : 'bg-white/5 border border-border'
                  }`}>
                    {isEditing ? (
                      <Edit className="h-5 w-5 text-brand-purple" />
                    ) : (
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-foreground font-orbitron text-lg">
                      {isEditing ? 'Editar' : 'Nova'} Configuração de Preço
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {selectedServiceType === 'COACHING'
                        ? 'Configure o preço por hora para diferentes faixas de horas'
                        : selectedMode === 'PREMIER'
                          ? 'Configure o preço por 1000 pontos para diferentes faixas de rating'
                          : 'Configure o preço por nível para diferentes faixas'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Range inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rangeStart" className="text-muted-foreground flex items-center gap-2">
                        {selectedServiceType === 'COACHING' ? 'Horas mínimas' : selectedMode === 'PREMIER' ? 'Rating Inicial' : 'Nível Inicial'}
                        {rangeStart && selectedServiceType !== 'COACHING' && (
                          <span className="text-xs text-brand-purple">
                            {selectedMode === 'PREMIER' ? parseInt(rangeStart).toLocaleString('pt-BR') : `Nível ${rangeStart}`}
                          </span>
                        )}
                      </Label>
                      <Input
                        id="rangeStart"
                        type="number"
                        step={selectedMode === 'PREMIER' ? "100" : "1"}
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        placeholder={selectedServiceType === 'COACHING' ? '1' : selectedMode === 'PREMIER' ? '0' : '1'}
                        required
                        disabled={isSaving}
                        className="bg-background border-border focus:border-brand-purple transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rangeEnd" className="text-muted-foreground flex items-center gap-2">
                        {selectedServiceType === 'COACHING' ? 'Horas máximas' : selectedMode === 'PREMIER' ? 'Rating Final' : 'Nível Final'}
                        {rangeEnd && selectedServiceType !== 'COACHING' && (
                          <span className="text-xs text-brand-purple">
                            {selectedMode === 'PREMIER' ? parseInt(rangeEnd).toLocaleString('pt-BR') : `Nível ${rangeEnd}`}
                          </span>
                        )}
                      </Label>
                      <Input
                        id="rangeEnd"
                        type="number"
                        step={selectedMode === 'PREMIER' ? "100" : "1"}
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        placeholder={selectedServiceType === 'COACHING' ? '10' : selectedMode === 'PREMIER' ? '4999' : '10'}
                        required
                        disabled={isSaving}
                        className="bg-background border-border focus:border-brand-purple transition-all"
                      />
                    </div>
                  </div>

                  {/* Price input */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-muted-foreground">
                        {selectedServiceType === 'COACHING' ? 'Preço por hora (R$)' : 'Preço (R$)'}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="25.00"
                          required
                          disabled={isSaving}
                          className="bg-background border-border focus:border-brand-purple pl-10 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  {(rangeStart && rangeEnd && price) && (
                    <div className="p-3 rounded-lg bg-white/5 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Preview</p>
                      <p className="text-sm text-foreground">
                        {selectedServiceType === 'COACHING'
                          ? `${rangeStart}h - ${rangeEnd}h`
                          : selectedMode === 'PREMIER'
                            ? `${parseInt(rangeStart).toLocaleString('pt-BR')} - ${parseInt(rangeEnd).toLocaleString('pt-BR')}`
                            : `Nível ${rangeStart} - ${rangeEnd}`}
                        {' → '}
                        <span className="text-brand-purple-light font-semibold">
                          R$ {parseFloat(price || '0').toFixed(2)}
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">
                          / {selectedServiceType === 'COACHING' ? '1 hora' : selectedMode === 'PREMIER' ? '100 pontos' : '1 nível'}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className={`transition-all duration-200 ${
                        isEditing ? '' : 'bg-green-600 hover:bg-green-500'
                      } ${isSaving ? 'opacity-80' : 'hover:scale-105'}`}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          {isEditing ? 'Salvando…' : 'Criando…'}
                        </>
                      ) : isEditing ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar Faixa
                        </>
                      )}
                    </Button>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isSaving}
                        className="border-border hover:bg-white/5 hover:border-white/20 transition-all"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Tabela de Configurações */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-foreground font-orbitron text-lg">Configurações Cadastradas</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {selectedServiceType === 'COACHING'
                      ? 'Faixas de horas e preços configurados'
                      : selectedMode === 'PREMIER'
                        ? 'Faixas de rating e preços configurados'
                        : 'Faixas de níveis e preços configurados'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchConfigs} className="border-border hover:border-brand-purple/50">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {configs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 bg-background/30 rounded-lg border border-border">
                    Nenhuma configuração encontrada para este modo de jogo.
                  </div>
                ) : (
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Faixa</TableHead>
                          <TableHead className="text-muted-foreground">Preço</TableHead>
                          <TableHead className="text-muted-foreground text-center">Ativo</TableHead>
                          <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {configs
                          .sort((a, b) => a.rangeStart - b.rangeStart)
                          .map((config) => (
                            <TableRow
                              key={config.id}
                              className={`border-border transition-all duration-300 ${
                                deletingId === config.id
                                  ? 'animate-row-delete opacity-0 scale-95 bg-red-500/10'
                                  : newlyAddedId === config.id
                                    ? 'animate-row-add bg-brand-purple/10 border-brand-purple/30'
                                    : editingId === config.id
                                      ? 'bg-brand-purple/5 border-brand-purple/20 ring-1 ring-brand-purple/30'
                                      : !config.enabled
                                        ? 'opacity-50 bg-white/5'
                                        : 'hover:bg-white/5'
                              }`}
                            >
                              <TableCell className="font-medium text-foreground">
                                {formatRangeDisplay(config)}
                              </TableCell>
                              <TableCell>
                                <span className="text-brand-purple-light font-semibold">
                                  R$ {config.price.toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={config.enabled}
                                  onCheckedChange={() => handleToggleEnabled(config)}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(config)}
                                    disabled={deletingId === config.id}
                                    className="border-border hover:border-brand-purple/50 hover:bg-brand-purple/10 hover:scale-110 h-8 w-8 p-0 transition-all duration-200"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteId(config.id)}
                                    disabled={deletingId === config.id}
                                    className="border-border hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 hover:scale-110 h-8 w-8 p-0 transition-all duration-200"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Calculator Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-foreground font-orbitron text-lg">
                  <Calculator className="h-5 w-5 text-brand-purple" />
                  Preview do Calculador
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Teste o cálculo de preço com as configurações atuais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calcCurrent" className="text-muted-foreground">
                    {selectedServiceType === 'COACHING' ? 'Número de horas' : selectedMode === 'PREMIER' ? 'Rating Atual (K)' : 'Nível Atual'}
                  </Label>
                  <Input
                    id="calcCurrent"
                    type="number"
                    value={calcCurrent}
                    onChange={(e) => setCalcCurrent(e.target.value)}
                    placeholder={selectedServiceType === 'COACHING' ? '3' : selectedMode === 'PREMIER' ? '10' : '5'}
                    className="bg-background border-border focus:border-brand-purple"
                  />
                </div>
                {selectedServiceType !== 'COACHING' && (
                  <div className="space-y-2">
                    <Label htmlFor="calcTarget" className="text-muted-foreground">
                      {selectedMode === 'PREMIER' ? 'Rating Desejado (K)' : 'Nível Desejado'}
                    </Label>
                    <Input
                      id="calcTarget"
                      type="number"
                      value={calcTarget}
                      onChange={(e) => setCalcTarget(e.target.value)}
                      placeholder={selectedMode === 'PREMIER' ? '15' : '10'}
                      className="bg-background border-border focus:border-brand-purple"
                    />
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleCalculatePreview}
                  disabled={isCalculating || !calcCurrent || (selectedServiceType !== 'COACHING' && !calcTarget)}
                >
                  {isCalculating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Calculando…
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Calcular Preço
                    </>
                  )}
                </Button>

                {calcResult !== null && (
                  <div className="mt-4 p-4 bg-brand-purple/10 border border-brand-purple/30 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Preço Calculado</p>
                    <p className="text-3xl font-bold text-brand-purple-light font-orbitron">
                      R$ {calcResult.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedServiceType === 'COACHING'
                        ? `${calcCurrent}h de coaching`
                        : selectedMode === 'PREMIER'
                          ? `${calcCurrent}K → ${calcTarget}K`
                          : `Nível ${calcCurrent} → ${calcTarget}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="bg-card border-red-500/20 shadow-2xl shadow-red-500/10">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-red-500/10 border border-red-500/30">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <AlertDialogTitle className="text-foreground font-orbitron text-lg">
                  Confirmar Exclusão
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-muted-foreground leading-relaxed">
                Tem certeza que deseja excluir esta configuração de preço? Esta ação não pode ser desfeita.
                <span className="block mt-2 text-yellow-400/80 text-sm">
                  💡 Dica: Considere desativar a faixa ao invés de deletá-la para manter histórico.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="border-border hover:bg-white/5 hover:border-white/20 transition-all">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 hover:scale-105 transition-all duration-200 shadow-lg shadow-red-500/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </>
      </LoadingSwap>
    </AdminPageShell>
  )
}
