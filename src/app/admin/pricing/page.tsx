'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DollarSign,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Save,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { ProfileSkeleton } from '@/components/common/loading-skeletons'
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

  // Form fields
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('')

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
  }, [user?.id, selectedGame, selectedMode])

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

  if (authLoading || loading) {
    return <ProfileSkeleton />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Configuração de Preços"
        description="Gerencie os preços de boost por faixas de rating ou níveis"
      />

      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Jogo</Label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CS2">Counter-Strike 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modo de Jogo</Label>
              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PREMIER">Premier</SelectItem>
                  <SelectItem value="GAMERS_CLUB">Gamers Club</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar' : 'Nova'} Configuração de Preço
          </CardTitle>
          <CardDescription>
            {selectedMode === 'PREMIER'
              ? 'Configure o preço por 1000 pontos para diferentes faixas de rating'
              : 'Configure o preço por nível para diferentes faixas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rangeStart">
                  {selectedMode === 'PREMIER' ? 'Rating Inicial' : 'Nível Inicial'}
                </Label>
                <Input
                  id="rangeStart"
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  placeholder={selectedMode === 'PREMIER' ? '0' : '1'}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rangeEnd">
                  {selectedMode === 'PREMIER' ? 'Rating Final' : 'Nível Final'}
                </Label>
                <Input
                  id="rangeEnd"
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  placeholder={selectedMode === 'PREMIER' ? '4999' : '10'}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">
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
                />
              </div>
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={getDefaultUnit()}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">
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
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Cadastradas</CardTitle>
          <CardDescription>
            {selectedMode === 'PREMIER'
              ? 'Faixas de rating e preços configurados'
              : 'Faixas de níveis e preços configurados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma configuração encontrada para este modo de jogo.
            </p>
          ) : (
            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold">
                      {selectedMode === 'PREMIER'
                        ? `${config.rangeStart.toLocaleString()} - ${config.rangeEnd.toLocaleString()} pontos`
                        : `Níveis ${config.rangeStart} - ${config.rangeEnd}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      R$ {config.price.toFixed(2)} por {config.unit}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta configuração de preço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
