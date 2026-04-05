// Pure utility functions for retention logic — no server-side imports
// (safe to use in client components)

// ─── Milestone tables ────────────────────────────────────────────────────────

const PREMIER_MILESTONES = [5000, 10000, 15000, 20000, 26000]
const GC_MILESTONES = [6, 11, 16, 20]

export function getNextMilestone(
  currentRating: number,
  gameMode: 'PREMIER' | 'GC'
): number | null {
  const milestones = gameMode === 'PREMIER' ? PREMIER_MILESTONES : GC_MILESTONES
  const next = milestones.find((m) => m > currentRating)
  return next ?? null // null = already at max
}

export function isAtMax(currentRating: number, gameMode: 'PREMIER' | 'GC'): boolean {
  return getNextMilestone(currentRating, gameMode) === null
}

// ─── Progress calculation ─────────────────────────────────────────────────────

export function calculateProgressPct(
  current: number,
  start: number,
  next: number
): number {
  if (next <= start) return 100
  const progress = ((current - start) / (next - start)) * 100
  return Math.min(100, Math.max(0, Math.round(progress)))
}

// ─── Streak discounts ─────────────────────────────────────────────────────────

export function getStreakDiscount(streak: number): number {
  if (streak <= 1) return 0
  if (streak === 2) return 0.05
  if (streak === 3) return 0.10
  return 0.15
}
