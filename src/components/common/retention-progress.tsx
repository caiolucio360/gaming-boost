'use client'

import { getNextMilestone, calculateProgressPct, isAtMax } from '@/lib/retention-utils'

interface CompletedOrderEntry {
  id: number
  targetRating: number | null
  targetRank: string | null
  gameMode: string
  completedAt: Date | string
}

interface RetentionProgressProps {
  completedOrders: CompletedOrderEntry[]
  currentDiscountPct: number
  gameMode: 'PREMIER' | 'GC'
}

function formatRating(value: number, gameMode: 'PREMIER' | 'GC'): string {
  if (gameMode === 'GC') return `Nível ${value}`
  return `${value.toLocaleString('pt-BR')} pts`
}

export function RetentionProgress({
  completedOrders,
  currentDiscountPct,
  gameMode,
}: RetentionProgressProps) {
  // Filter to this gameMode only (PREMIER or GC)
  const orders = completedOrders
    .filter((o) => {
      const gm = o.gameMode?.toUpperCase() ?? ''
      return gameMode === 'GC' ? gm.includes('GC') : gm.includes('PREMIER')
    })
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())

  if (orders.length === 0) return null

  const latest = orders[orders.length - 1]
  const currentRating = latest.targetRating ?? 0
  const nextMilestone = getNextMilestone(currentRating, gameMode)
  const progressPct = nextMilestone
    ? calculateProgressPct(currentRating, 0, nextMilestone)
    : 100
  const atMax = isAtMax(currentRating, gameMode)
  const discountLabel = currentDiscountPct > 0
    ? `${Math.round(currentDiscountPct * 100)}% de desconto`
    : null

  return (
    <div className="bg-brand-black-light border border-brand-purple/20 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-white text-sm font-bold tracking-wide font-orbitron"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          PROGRESSÃO
        </h3>
        {discountLabel && (
          <span className="text-xs font-semibold bg-brand-purple/20 text-brand-purple-light border border-brand-purple/40 rounded-full px-2 py-0.5">
            {discountLabel} disponível
          </span>
        )}
      </div>

      {/* Rating display */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-brand-gray-500 mb-0.5">Rating atual</p>
          <p
            className="text-2xl font-bold text-white font-orbitron"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            {formatRating(currentRating, gameMode)}
          </p>
        </div>
        {!atMax && nextMilestone && (
          <div className="text-right">
            <p className="text-xs text-brand-gray-500 mb-0.5">Próximo marco</p>
            <p
              className="text-lg font-bold text-brand-purple-light font-orbitron"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {formatRating(nextMilestone, gameMode)}
            </p>
          </div>
        )}
        {atMax && (
          <p className="text-green-400 text-sm font-semibold">🏆 Rating máximo!</p>
        )}
      </div>

      {/* Progress bar */}
      {!atMax && (
        <div>
          <div className="flex justify-between text-xs text-brand-gray-500 mb-1.5">
            <span>{progressPct}% concluído</span>
            {nextMilestone && (
              <span>Faltam {formatRating(nextMilestone - currentRating, gameMode)}</span>
            )}
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-purple to-brand-purple-light rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <p className="text-xs text-brand-gray-500 font-semibold uppercase tracking-wider">
          Histórico
        </p>
        {orders.slice(-4).map((order) => (
          <div key={order.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-purple-light flex-shrink-0" />
              <span className="text-brand-gray-300">
                {formatRating(order.targetRating ?? 0, gameMode)}
              </span>
            </div>
            <span className="text-brand-gray-500 text-xs">
              {new Date(order.completedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        ))}
        {!atMax && (
          <div className="flex items-center gap-2 text-sm opacity-40">
            <div className="w-1.5 h-1.5 rounded-full border border-brand-purple-light flex-shrink-0" />
            <span className="text-brand-gray-500">Próximo</span>
          </div>
        )}
      </div>
    </div>
  )
}
