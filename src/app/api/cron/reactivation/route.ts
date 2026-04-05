/**
 * Reactivation Cron Job
 *
 * This endpoint is designed to be called by Vercel Cron daily.
 * It finds clients whose last completed order was 14 days ago and who
 * haven't placed a new order, then sends them a reactivation email
 * with a time-limited discount offer.
 *
 * Schedule: Runs daily (configured in vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendReactivationEmail } from '@/lib/email'
import { getNextMilestone } from '@/lib/retention-utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  // Auth guard — same pattern as /api/cron/auto-refund
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[CRON:REACTIVATION] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CRON:REACTIVATION] Unauthorized access attempt', {
      ip: request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
  const fortyEightHoursMs = 48 * 60 * 60 * 1000

  // Find CLIENT users whose last completed order was 14-15 days ago
  const candidates = await db.user.findMany({
    where: {
      emailMarketing: true,
      role: 'CLIENT',
      streakLastOrderAt: {
        gte: fifteenDaysAgo,
        lte: fourteenDaysAgo,
      },
    },
    select: {
      id: true,
      email: true,
      currentDiscountPct: true,
      reactivationDiscountExpiresAt: true,
      orders: {
        where: {
          createdAt: { gte: fourteenDaysAgo },
          status: { not: 'CANCELLED' },
        },
        select: { id: true },
        take: 1,
      },
    },
  })

  let sent = 0
  let skipped = 0

  for (const user of candidates) {
    // Skip if user already has a new non-cancelled order
    if (user.orders.length > 0) {
      skipped++
      continue
    }

    // Skip if a reactivation discount is still active (already sent this cycle)
    if (
      user.reactivationDiscountExpiresAt &&
      user.reactivationDiscountExpiresAt > now
    ) {
      skipped++
      continue
    }

    // Get their most recent completed order for rating context
    const lastOrder = await db.order.findFirst({
      where: { userId: user.id, status: 'COMPLETED' },
      orderBy: { updatedAt: 'desc' },
      select: { targetRating: true, gameMode: true },
    })

    if (!lastOrder || lastOrder.targetRating == null) {
      skipped++
      continue
    }

    const currentRating = lastOrder.targetRating
    const rawGameMode = lastOrder.gameMode ?? ''
    const gameMode: 'PREMIER' | 'GC' = rawGameMode.toUpperCase().includes('GC') ? 'GC' : 'PREMIER'
    const nextMilestone = getNextMilestone(currentRating, gameMode)

    if (!nextMilestone) {
      // User is at max rating — no reactivation incentive
      skipped++
      continue
    }

    const discountPct = Math.max(user.currentDiscountPct ?? 0, 0.05) // minimum 5%
    const expiresAt = new Date(now.getTime() + fortyEightHoursMs)

    // Store the reactivation discount on the user
    await db.user.update({
      where: { id: user.id },
      data: {
        reactivationDiscountPct: discountPct,
        reactivationDiscountExpiresAt: expiresAt,
      },
    })

    // Send reactivation email
    await sendReactivationEmail(user.email, {
      currentRating,
      currentRatingLabel:
        gameMode === 'GC'
          ? `Nível ${currentRating}`
          : `${currentRating.toLocaleString('pt-BR')} pts`,
      nextMilestone,
      nextMilestoneLabel:
        gameMode === 'GC'
          ? `Nível ${nextMilestone}`
          : `${nextMilestone.toLocaleString('pt-BR')} pts`,
      discountPct,
      discountExpiresAt: expiresAt,
    })

    sent++
  }

  console.log(
    `[CRON:REACTIVATION] Processed ${candidates.length} candidates: ${sent} sent, ${skipped} skipped`
  )

  return NextResponse.json({
    success: true,
    processed: candidates.length,
    sent,
    skipped,
  })
}
