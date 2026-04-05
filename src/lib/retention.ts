import { prisma } from '@/lib/db'

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

// ─── Streak updater (called on order COMPLETED) ───────────────────────────────

const STREAK_WINDOW_DAYS = 30

export async function updateUserStreak(userId: number): Promise<{
  newStreak: number
  newDiscountPct: number
  leveledUp: boolean
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { completedOrdersStreak: true, streakLastOrderAt: true, currentDiscountPct: true },
  })

  if (!user) throw new Error(`User ${userId} not found`)

  const now = new Date()
  const windowMs = STREAK_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const isWithinWindow =
    user.streakLastOrderAt !== null &&
    now.getTime() - user.streakLastOrderAt.getTime() <= windowMs

  const newStreak = isWithinWindow ? user.completedOrdersStreak + 1 : 1
  const newDiscountPct = getStreakDiscount(newStreak)
  const leveledUp = newDiscountPct > user.currentDiscountPct

  await prisma.user.update({
    where: { id: userId },
    data: {
      completedOrdersStreak: newStreak,
      streakLastOrderAt: now,
      currentDiscountPct: newDiscountPct,
    },
  })

  return { newStreak, newDiscountPct, leveledUp }
}

// ─── Reactivation discount helpers ───────────────────────────────────────────

export function isReactivationDiscountValid(
  expiresAt: Date | null
): boolean {
  if (!expiresAt) return false
  return expiresAt > new Date()
}

export function bestAvailableDiscount(
  currentDiscountPct: number,
  reactivationDiscountPct: number,
  reactivationDiscountExpiresAt: Date | null
): number {
  const reactivationValid = isReactivationDiscountValid(reactivationDiscountExpiresAt)
  const reactivation = reactivationValid ? reactivationDiscountPct : 0
  return Math.max(currentDiscountPct, reactivation)
}
