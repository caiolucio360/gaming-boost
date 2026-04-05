import { prisma } from '@/lib/db'
import { getStreakDiscount } from '@/lib/retention-utils'

export {
  getNextMilestone,
  isAtMax,
  calculateProgressPct,
  getStreakDiscount,
} from '@/lib/retention-utils'

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
  // Streak is valid if last order was within 30 days (inclusive).
  // An order placed exactly at the 30-day mark still keeps the streak.
  // After 30 days have passed, the streak resets to 1.
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
