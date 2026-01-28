'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  ArrowLeft,
  Save,
  X,
  AlertTriangle,
  Calculator,
  RefreshCw,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { showSuccess, showError } from '@/lib/toast'
import Link from 'next/link'
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
  rangeStart: number
  rangeEnd: number
  price: number
  unit: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface Gap {
  start: number
  end: number
}

/**
 * Skeleton específico para a página de configuração de preços
 */
function PricingPageSkeleton() {
  return (
    <div className="min-h-screen bg-brand-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2 bg-brand-black-light" />
          <Skeleton className="h-5 w-96 max-w-full bg-brand-black-light" />
        </div>

        {/* Back button skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-40 bg-brand-black-light" />
        </div>

        {/* Filters card skeleton */}
        <Card className="mb-6 bg-brand-black-light border-white/10">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-20 bg-white/5" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12 bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column skeletons */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form card skeleton */}
            <Card className="bg-brand-black-light border-white/10">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-48 bg-white/5" />
                <Skeleton className="h-4 w-72 max-w-full bg-white/5" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-white/5" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-white/5" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20 bg-white/5" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16 bg-white/5" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                  </div>
                </div>
                <Skeleton className="h-10 w-24 bg-white/5" />
              </CardContent>
            </Card>

            {/* Table card skeleton */}
            <Card className="bg-brand-black-light border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-52 bg-white/5" />
                  <Skeleton className="h-4 w-64 max-w-full bg-white/5" />
                </div>
                <Skeleton className="h-9 w-9 bg-white/5" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-full bg-white/5" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column skeleton */}
          <div className="lg:col-span-1">
            <Card className="bg-brand-black-light border-white/10">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-40 bg-white/5" />
                <Skeleton className="h-4 w-56 max-w-full bg-white/5" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 bg-white/5" />
                  <Skeleton className="h-10 w-full bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-white/5" />
                  <Skeleton className="h-10 w-full bg-white/5" />
                </div>
                <Skeleton className="h-10 w-full bg-white/5" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingConfigPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [configs, setConfigs] = useState<PricingConfig[]>([])
  const [selectedGame, setSelectedGame] = useState<string>('CS2')
  const [selectedMode, setSelectedMode] = useState<string>('PREMIER')
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Form fields
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('')

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
  }, [user?.id, selectedGame, selectedMode])

  // Gap Analysis
  const gaps = useMemo((): Gap[] => {
    const enabledConfigs = configs.filter(c => c.enabled).sort((a, b) => a.rangeStart - b.rangeStart)
    if (enabledConfigs.length === 0) return []

    const detectedGaps: Gap[] = []
    const minExpected = selectedMode === 'PREMIER' ? 0 : 1
    const maxExpected = selectedMode === 'PREMIER' ? 26000 : 20

    // Check if first range starts at expected minimum
    if (enabledConfigs[0].rangeStart > minExpected) {
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
    if (lastConfig.rangeEnd < maxExpected) {
      detectedGaps.push({ start: lastConfig.rangeEnd + 1, end: maxExpected })
    }

    return detectedGaps
  }, [configs, selectedMode])

  const fetchConfigs = async () => {
    await withLoading(async () => {
      try {
        const params = new URLSearchParams()
        if (selectedGame) params.append('game', selectedGame)
        if (selectedMode) params.append('gameMode', selectedMode)

        const response = await fetch(`/api/admin/pricing?${params}`)
        if (response.ok) {
          const data = await response.json()
          setConfigs(data.data)
        } else {
          showError('Erro', 'Não foi possível carregar as configurações')
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error)
        showError('Erro', 'Erro ao buscar configurações')
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rangeStart || !rangeEnd || !price || !unit) {
      showError('Erro', 'Preencha todos os campos')
      return
    }

    try {
      const body = {
        game: selectedGame,
        gameMode: selectedMode,
        rangeStart: parseInt(rangeStart),
        rangeEnd: parseInt(rangeEnd),
        price: parseFloat(price),
        unit,
        enabled: true,
      }

      const url = editingId
        ? `/api/admin/pricing/${editingId}`
        : '/api/admin/pricing'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        showSuccess('Sucesso', editingId ? 'Configuração atualizada' : 'Configuração criada')
        resetForm()
        fetchConfigs()
      } else {
        const error = await response.json()
        showError('Erro', error.error || 'Erro ao salvar configuração')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showError('Erro', 'Erro ao salvar configuração')
    }
  }

  const handleEdit = (config: PricingConfig) => {
    setEditingId(config.id)
    setIsEditing(true)
    setRangeStart(config.rangeStart.toString())
    setRangeEnd(config.rangeEnd.toString())
    setPrice(config.price.toString())
    setUnit(config.unit)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/admin/pricing/${deleteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccess('Sucesso', 'Configuração deletada')
        setDeleteId(null)
        fetchConfigs()
      } else {
        const error = await response.json()
        showError('Erro', error.error || 'Erro ao deletar configuração')
      }
    } catch (error) {
      console.error('Erro ao deletar:', error)
      showError('Erro', 'Erro ao deletar configuração')
    }
  }

  const handleToggleEnabled = async (config: PricingConfig) => {
    setTogglingId(config.id)
    try {
      const response = await fetch(`/api/admin/pricing/${config.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !config.enabled }),
      })

      if (response.ok) {
        showSuccess('Sucesso', config.enabled ? 'Faixa desativada' : 'Faixa ativada')
        fetchConfigs()
      } else {
        const error = await response.json()
        showError('Erro', error.error || 'Erro ao alterar status')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      showError('Erro', 'Erro ao alterar status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleCalculatePreview = async () => {
    if (!calcCurrent || !calcTarget) {
      showError('Erro', 'Preencha os valores atual e desejado')
      return
    }

    const current = parseInt(calcCurrent)
    const target = parseInt(calcTarget)

    if (current >= target) {
      showError('Erro', 'O valor atual deve ser menor que o desejado')
      return
    }

    setIsCalculating(true)
    try {
      const currentValue = selectedMode === 'PREMIER' ? current * 1000 : current
      const targetValue = selectedMode === 'PREMIER' ? target * 1000 : target

      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: selectedGame,
          gameMode: selectedMode,
          current: currentValue,
          target: targetValue,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCalcResult(data.data.price)
      } else {
        const error = await response.json()
        showError('Erro', error.error || 'Erro ao calcular preço')
        setCalcResult(null)
      }
    } catch (error) {
      console.error('Erro ao calcular:', error)
      showError('Erro', 'Erro ao calcular preço')
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
    setUnit('')
  }

  const getDefaultUnit = () => {
    return selectedMode === 'PREMIER' ? '1000 pontos' : '1 nível'
  }

  const formatRangeDisplay = (config: PricingConfig) => {
    if (selectedMode === 'PREMIER') {
      return `${(config.rangeStart / 1000).toFixed(0)}K - ${(config.rangeEnd / 1000).toFixed(0)}K`
    }
    return `Nível ${config.rangeStart} - ${config.rangeEnd}`
  }

  if (authLoading || loading) {
    return <PricingPageSkeleton />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-brand-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Configuração de Preços"
          description="Gerencie os preços de boost por faixas de rating ou níveis"
        />

        <div className="mb-6">
          <Button variant="outline" asChild className="border-white/10 hover:border-brand-purple/50">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6 bg-brand-black-light border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-white font-orbitron text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-gray-300">Jogo</Label>
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
                <Label className="text-brand-gray-300">Modo de Jogo</Label>
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
                    <SelectItem value="GAMERS_CLUB">Gamers Club</SelectItem>
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
              <p className="mb-2 text-red-200">
                As seguintes faixas não possuem preço configurado e causarão erro no cálculo:
              </p>
              <ul className="list-disc list-inside space-y-1 text-red-300">
                {gaps.map((gap, i) => (
                  <li key={i}>
                    {selectedMode === 'PREMIER'
                      ? `${(gap.start / 1000).toFixed(0)}K - ${(gap.end / 1000).toFixed(0)}K`
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
            <Card className="bg-brand-black-light border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-white font-orbitron text-lg">
                  {isEditing ? 'Editar' : 'Nova'} Configuração de Preço
                </CardTitle>
                <CardDescription className="text-brand-gray-400">
                  {selectedMode === 'PREMIER'
                    ? 'Configure o preço por 1000 pontos para diferentes faixas de rating'
                    : 'Configure o preço por nível para diferentes faixas'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rangeStart" className="text-brand-gray-300">
                        {selectedMode === 'PREMIER' ? 'Rating Inicial' : 'Nível Inicial'}
                      </Label>
                      <Input
                        id="rangeStart"
                        type="number"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        placeholder={selectedMode === 'PREMIER' ? '0' : '1'}
                        required
                        className="bg-brand-black border-white/10 focus:border-brand-purple"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rangeEnd" className="text-brand-gray-300">
                        {selectedMode === 'PREMIER' ? 'Rating Final' : 'Nível Final'}
                      </Label>
                      <Input
                        id="rangeEnd"
                        type="number"
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        placeholder={selectedMode === 'PREMIER' ? '4999' : '10'}
                        required
                        className="bg-brand-black border-white/10 focus:border-brand-purple"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-brand-gray-300">
                        Preço (R$)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="25.00"
                        required
                        className="bg-brand-black border-white/10 focus:border-brand-purple"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit" className="text-brand-gray-300">Unidade</Label>
                      <Input
                        id="unit"
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder={getDefaultUnit()}
                        required
                        className="bg-brand-black border-white/10 focus:border-brand-purple"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="bg-brand-purple hover:bg-brand-purple-light">
                      {isEditing ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Atualizar
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar
                        </>
                      )}
                    </Button>
                    {isEditing && (
                      <Button type="button" variant="outline" onClick={resetForm} className="border-white/10">
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Tabela de Configurações */}
            <Card className="bg-brand-black-light border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-white font-orbitron text-lg">Configurações Cadastradas</CardTitle>
                  <CardDescription className="text-brand-gray-400">
                    {selectedMode === 'PREMIER'
                      ? 'Faixas de rating e preços configurados'
                      : 'Faixas de níveis e preços configurados'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchConfigs} className="border-white/10 hover:border-brand-purple/50">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {configs.length === 0 ? (
                  <div className="text-center text-brand-gray-400 py-8 bg-brand-black/30 rounded-lg border border-white/5">
                    Nenhuma configuração encontrada para este modo de jogo.
                  </div>
                ) : (
                  <div className="rounded-md border border-white/10 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-brand-gray-300">Faixa</TableHead>
                          <TableHead className="text-brand-gray-300">Preço</TableHead>
                          <TableHead className="text-brand-gray-300 hidden sm:table-cell">Unidade</TableHead>
                          <TableHead className="text-brand-gray-300 text-center">Ativo</TableHead>
                          <TableHead className="text-brand-gray-300 text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {configs
                          .sort((a, b) => a.rangeStart - b.rangeStart)
                          .map((config) => (
                            <TableRow
                              key={config.id}
                              className={`border-white/10 ${!config.enabled ? 'opacity-50 bg-white/5' : 'hover:bg-white/5'}`}
                            >
                              <TableCell className="font-medium text-white">
                                {formatRangeDisplay(config)}
                                {!config.enabled && (
                                  <Badge variant="secondary" className="ml-2 bg-white/10 text-brand-gray-400 text-xs">
                                    Desativada
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-brand-purple-light font-semibold">
                                  R$ {config.price.toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="text-brand-gray-400 hidden sm:table-cell">
                                {config.unit}
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={config.enabled}
                                  onCheckedChange={() => handleToggleEnabled(config)}
                                  disabled={togglingId === config.id}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(config)}
                                    className="border-white/10 hover:border-brand-purple/50 h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteId(config.id)}
                                    className="border-white/10 hover:border-red-500/50 hover:text-red-400 h-8 w-8 p-0"
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
            <Card className="sticky top-4 bg-brand-black-light border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white font-orbitron text-lg">
                  <Calculator className="h-5 w-5 text-brand-purple" />
                  Preview do Calculador
                </CardTitle>
                <CardDescription className="text-brand-gray-400">
                  Teste o cálculo de preço com as configurações atuais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calcCurrent" className="text-brand-gray-300">
                    {selectedMode === 'PREMIER' ? 'Rating Atual (K)' : 'Nível Atual'}
                  </Label>
                  <Input
                    id="calcCurrent"
                    type="number"
                    value={calcCurrent}
                    onChange={(e) => setCalcCurrent(e.target.value)}
                    placeholder={selectedMode === 'PREMIER' ? '10' : '5'}
                    className="bg-brand-black border-white/10 focus:border-brand-purple"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calcTarget" className="text-brand-gray-300">
                    {selectedMode === 'PREMIER' ? 'Rating Desejado (K)' : 'Nível Desejado'}
                  </Label>
                  <Input
                    id="calcTarget"
                    type="number"
                    value={calcTarget}
                    onChange={(e) => setCalcTarget(e.target.value)}
                    placeholder={selectedMode === 'PREMIER' ? '15' : '10'}
                    className="bg-brand-black border-white/10 focus:border-brand-purple"
                  />
                </div>
                <Button
                  className="w-full bg-brand-purple hover:bg-brand-purple-light"
                  onClick={handleCalculatePreview}
                  disabled={isCalculating || !calcCurrent || !calcTarget}
                >
                  {isCalculating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Calculando...
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
                    <p className="text-sm text-brand-gray-400 mb-1">Preço Calculado</p>
                    <p className="text-3xl font-bold text-brand-purple-light font-orbitron">
                      R$ {calcResult.toFixed(2)}
                    </p>
                    <p className="text-xs text-brand-gray-400 mt-2">
                      {selectedMode === 'PREMIER'
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
          <AlertDialogContent className="bg-brand-black-light border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white font-orbitron">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-brand-gray-400">
                Tem certeza que deseja excluir esta configuração de preço? Esta ação não pode ser desfeita.
                Considere desativar a faixa ao invés de deletá-la para manter histórico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 hover:bg-white/5">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
