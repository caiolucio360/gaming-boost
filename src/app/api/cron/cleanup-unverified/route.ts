/**
 * Cleanup Unverified Accounts Cron Job
 *
 * Deletes accounts that never confirmed their e-mail (active: false) after a
 * grace window. Unconfirmed accounts can't log in, so they can never own orders
 * or perform any action — they just hold their unique e-mail hostage and bloat
 * the User table. Removing them frees the e-mail for a fresh registration.
 *
 * Deleting the user cascades its verificationCodes (onDelete: Cascade). We still
 * guard on `orders: none` defensively so an account that somehow owns data is
 * never destroyed.
 *
 * Schedule: configured in vercel.json. Grace window: UNVERIFIED_CLEANUP_DAYS
 * (default 7 days).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { HttpStatus } from '@/lib/http-status'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_GRACE_DAYS = 7

function getGraceDays(): number {
  const raw = parseInt(process.env.UNVERIFIED_CLEANUP_DAYS || '', 10)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_GRACE_DAYS
}

/**
 * POST /api/cron/cleanup-unverified
 *
 * Security: protected by CRON_SECRET (mandatory in all environments).
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[CRON] CRON_SECRET not configured')
      return NextResponse.json(
        { message: 'Cron secret not configured' },
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[CRON] Unauthorized access attempt', {
        ip: request.headers.get('x-forwarded-for'),
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HttpStatus.UNAUTHORIZED }
      )
    }

    const graceDays = getGraceDays()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - graceDays)

    console.log(`🧹 Cleanup-unverified: removing active:false accounts created before ${cutoff.toISOString()} (grace ${graceDays}d)`)

    const result = await prisma.user.deleteMany({
      where: {
        active: false,
        isDevAdmin: false,
        createdAt: { lt: cutoff },
        orders: { none: {} },
      },
    })

    console.log(`✅ Cleanup-unverified: deleted ${result.count} unconfirmed account(s)`)

    return NextResponse.json({
      message: 'Cleanup completed',
      deleted: result.count,
      graceDays,
    })
  } catch (error) {
    console.error('❌ Cleanup-unverified cron job error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unknown error' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}
