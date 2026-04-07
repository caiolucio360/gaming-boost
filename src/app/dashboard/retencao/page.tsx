// src/app/dashboard/retencao/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Gift, Star, Zap, Trophy } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { RetentionProgress } from '@/components/common/retention-progress'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface CompletedOrder {
  id: number
  targetRating: number | null
  targetRank: string | null
  gameMode: string | null
  completedAt: string
}

const TIERS = [
  { orders: 1, discount: 0,  label: '0%',  icon: Star,   color: 'text-gray-400' },
  { orders: 2, discount: 5,  label: '5%',  icon: Zap,    color: 'text-brand-purple-light' },
  { orders: 3, discount: 10, label: '10%', icon: Gift,   color: 'text-yellow-400' },
  { orders: 4, discount: 15, label: '15%', icon: Trophy, color: 'text-green-400' },
]

export default function RetencaoPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([])
  const [streak, setStreak] = useState(0)
  const [discountPct, setDiscountPct] = useState(0)
  const { loading, withLoading } = useLoading({ initialLoading: true })

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      withLoading(async () => {
        const res = await fetch('/api/user/retention')
        if (res.ok) {
          const data = await res.json()
          setCompletedOrders(data.completedOrders || [])
          setStreak(data.streak || 0)
          setDiscountPct(data.discountPct || 0)
        }
      })
    }
  }, [user?.id])

  if (authLoading || loading) return <LoadingSpinner />
  if (!user) return null

  const hasPremier = completedOrders.some((o) => o.gameMode?.toUpperCase().includes('PREMIER'))
  const hasGC = completedOrders.some((o) => o.gameMode?.toUpperCase().includes('GC'))
  // RetentionProgress requires gameMode: string — filter out null values
  const ordersForProgress = completedOrders.filter((o): o is CompletedOrder & { gameMode: string } => o.gameMode !== null)

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-brand-purple-light hover:text-brand-purple-light mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Dashboard
          </Button>
        </Link>
      </div>

      <PageHeader
        highlight="PROGRAMA DE"
        title="FIDELIDADE"
        description="Quanto mais você impulsiona, mais você economiza. Veja seu progresso e descontos disponíveis."
      />

      {/* Discount badge */}
      <div className="mb-6">
        {discountPct > 0 ? (
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Trophy className="w-10 h-10 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-300 font-bold text-xl font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {Math.round(discountPct * 100)}% DE DESCONTO DISPONÍVEL
                  </p>
                  <p className="text-green-400/80 text-sm font-rajdhani mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Seu desconto de fidelidade é aplicado automaticamente no próximo boost.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-brand-purple/20 to-brand-purple-dark/10 border-brand-purple/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Gift className="w-10 h-10 text-brand-purple-light flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-lg font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {streak === 0 ? 'COMPLETE SEU PRIMEIRO BOOST' : 'COMPLETE MAIS UM BOOST'}
                  </p>
                  <p className="text-brand-gray-400 text-sm font-rajdhani mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {streak === 0
                      ? 'Faça seu primeiro pedido e comece a acumular descontos.'
                      : 'Mais 1 boost concluído para desbloquear 5% de desconto.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progression widgets */}
      {(hasPremier || hasGC) && (
        <div className="grid gap-4 mb-6">
          {hasPremier && (
            <RetentionProgress
              completedOrders={ordersForProgress}
              currentDiscountPct={discountPct}
              gameMode="PREMIER"
            />
          )}
          {hasGC && (
            <RetentionProgress
              completedOrders={ordersForProgress}
              currentDiscountPct={discountPct}
              gameMode="GC"
            />
          )}
        </div>
      )}

      {/* Tier table */}
      <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 mb-6">
        <CardHeader>
          <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Níveis de Desconto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {TIERS.map((tier) => {
              const isActive = streak >= tier.orders
              const isCurrent = streak === tier.orders || (tier.orders === 4 && streak >= 4)
              const Icon = tier.icon
              return (
                <div
                  key={tier.orders}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCurrent
                      ? 'bg-brand-purple/20 border-brand-purple/60'
                      : isActive
                      ? 'bg-white/5 border-white/10'
                      : 'bg-black/20 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${tier.color}`} />
                    <span className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      {tier.orders === 4 ? '4+ pedidos concluídos' : `${tier.orders} pedido${tier.orders > 1 ? 's' : ''} concluído${tier.orders > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={tier.discount > 0 ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-white/10 text-gray-400 border-white/20'}>
                      {tier.discount > 0 ? `${tier.discount}% off` : 'Sem desconto'}
                    </Badge>
                    {isCurrent && <Badge className="bg-brand-purple/30 text-brand-purple-light border-brand-purple/50">Você está aqui</Badge>}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* How to use */}
      <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/30 mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-brand-purple-light flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Como usar meu desconto?</p>
              <p className="text-brand-gray-400 text-sm mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Seu desconto de fidelidade é aplicado automaticamente ao contratar um novo boost. Não é necessário nenhum cupom — basta escolher o serviço e o desconto aparece no checkout.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {completedOrders.length > 0 && (
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
          <CardHeader>
            <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Histórico de Boosts Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...completedOrders].reverse().map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {order.gameMode || 'CS2'}{order.targetRating ? ` → ${order.targetRating.toLocaleString('pt-BR')} pts` : order.targetRank ? ` → ${order.targetRank}` : ''}
                    </p>
                    <p className="text-gray-500 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Pedido #{order.id}</p>
                  </div>
                  <p className="text-brand-gray-400 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {formatDate(order.completedAt)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {completedOrders.length === 0 && (
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/30">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-brand-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Você ainda não tem boosts concluídos. Complete seu primeiro pedido para começar a acumular descontos!
            </p>
            <Link href="/games/cs2" className="mt-4 inline-block">
              <Button className="bg-brand-purple hover:bg-brand-purple-dark text-white font-bold mt-4">
                Contratar Boost
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
