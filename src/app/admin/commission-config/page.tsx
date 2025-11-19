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
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Percent,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ProfileSkeleton } from '@/components/common/loading-skeletons'
import { showSuccess, showError } from '@/lib/toast'
import Link from 'next/link'

interface CommissionConfig {
  id: number
  boosterPercentage: number
  adminPercentage: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export default function CommissionConfigPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<CommissionConfig | null>(null)
  const [boosterPercentage, setBoosterPercentage] = useState('70')
  const [adminPercentage, setAdminPercentage] = useState('30')
  const [alert, setAlert] = useState<{ 
    title: string
    description: string
    variant: 'default' | 'destructive'
  } | null>(null)

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
      fetchConfig()
    }
  }, [user?.id])

  const fetchConfig = async () => {
    await withLoading(async () => {
      try {
        const response = await fetch('/api/admin/commission-config')
        if (response.ok) {
          const data = await response.json()
          setConfig(data.config)
          setBoosterPercentage((data.config.boosterPercentage * 100).toFixed(0))
          setAdminPercentage((data.config.adminPercentage * 100).toFixed(0))
        } else {
          setAlert({
            title: 'Erro',
            description: 'Não foi possível carregar a configuração',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Erro ao buscar configuração:', error)
        setAlert({
          title: 'Erro',
          description: 'Erro ao buscar configuração',
          variant: 'destructive',
        })
      }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setAlert(null)

      // Validar valores
      const booster = parseFloat(boosterPercentage)
      const admin = parseFloat(adminPercentage)

      if (isNaN(booster) || isNaN(admin)) {
        setAlert({
          title: 'Erro',
          description: 'Porcentagens devem ser números válidos',
          variant: 'destructive',
        })
        return
      }

      if (booster < 0 || booster > 100 || admin < 0 || admin > 100) {
        setAlert({
          title: 'Erro',
          description: 'Porcentagens devem estar entre 0 e 100',
          variant: 'destructive',
        })
        return
      }

      if (Math.abs(booster + admin - 100) > 0.01) {
        setAlert({
          title: 'Erro',
          description: 'A soma das porcentagens deve ser 100%',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/admin/commission-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boosterPercentage: booster / 100,
          adminPercentage: admin / 100,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setConfig(data.config)
        setAlert({
          title: 'Sucesso',
          description: 'Configuração de comissão atualizada com sucesso!',
          variant: 'default',
        })
        showSuccess('Configuração atualizada com sucesso!')
      } else {
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao atualizar configuração',
          variant: 'destructive',
        })
        showError(data.message || 'Erro ao atualizar configuração')
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao salvar configuração',
        variant: 'destructive',
      })
      showError('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  // Loading de tela inteira apenas para autenticação
  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="text-purple-300 hover:text-purple-200 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Dashboard
            </Button>
          </Link>
        </div>

        <PageHeader
          highlight="CONFIGURAÇÃO DE"
          title="COMISSÕES"
          description="Configure as porcentagens de comissão para boosters e administradores"
        />

        {alert && (
          <Alert variant={alert.variant} className="mb-6">
            {alert.variant === 'default' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <Card className="bg-black/30 border-purple-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-400" />
              Porcentagens de Comissão
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure como o valor dos pedidos será distribuído entre boosters e administradores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Porcentagem do Booster */}
              <div className="space-y-2">
                <Label htmlFor="boosterPercentage" className="text-gray-400 flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Porcentagem do Booster (%)
                </Label>
                <Input
                  id="boosterPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="70"
                  value={boosterPercentage}
                  onChange={(e) => {
                    setBoosterPercentage(e.target.value)
                    // Calcular automaticamente a porcentagem do admin
                    const booster = parseFloat(e.target.value)
                    if (!isNaN(booster) && booster >= 0 && booster <= 100) {
                      setAdminPercentage((100 - booster).toFixed(1))
                    }
                  }}
                  className="bg-black/50 border-purple-500/50 text-white text-lg font-bold"
                />
                <p className="text-xs text-gray-500">
                  Valor que o booster receberá por cada pedido concluído
                </p>
              </div>

              {/* Porcentagem do Admin */}
              <div className="space-y-2">
                <Label htmlFor="adminPercentage" className="text-gray-400 flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Porcentagem do Admin (%)
                </Label>
                <Input
                  id="adminPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="30"
                  value={adminPercentage}
                  onChange={(e) => {
                    setAdminPercentage(e.target.value)
                    // Calcular automaticamente a porcentagem do booster
                    const admin = parseFloat(e.target.value)
                    if (!isNaN(admin) && admin >= 0 && admin <= 100) {
                      setBoosterPercentage((100 - admin).toFixed(1))
                    }
                  }}
                  className="bg-black/50 border-purple-500/50 text-white text-lg font-bold"
                />
                <p className="text-xs text-gray-500">
                  Valor que o administrador receberá por cada pedido concluído
                </p>
              </div>
            </div>

            {/* Indicador de Soma */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Soma das porcentagens:</span>
                <span className={`text-lg font-bold ${
                  Math.abs(parseFloat(boosterPercentage) + parseFloat(adminPercentage) - 100) < 0.01
                    ? 'text-green-300'
                    : 'text-red-300'
                }`}>
                  {(parseFloat(boosterPercentage) + parseFloat(adminPercentage)).toFixed(1)}%
                </span>
              </div>
              {Math.abs(parseFloat(boosterPercentage) + parseFloat(adminPercentage) - 100) >= 0.01 && (
                <p className="text-xs text-red-400 mt-2">
                  A soma deve ser exatamente 100%
                </p>
              )}
            </div>

            {/* Exemplo de Cálculo */}
            {config && (
              <div className="p-4 bg-black/50 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Exemplo de cálculo (pedido de R$ 100,00):</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Booster receberá:</p>
                    <p className="text-green-300 font-bold">R$ {(100 * parseFloat(boosterPercentage) / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Admin receberá:</p>
                    <p className="text-purple-300 font-bold">R$ {(100 * parseFloat(adminPercentage) / 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || Math.abs(parseFloat(boosterPercentage) + parseFloat(adminPercentage) - 100) >= 0.01}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  )
}

