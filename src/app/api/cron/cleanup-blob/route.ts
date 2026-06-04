/**
 * Vercel Blob Cleanup Cron Job
 *
 * This endpoint is called by Vercel Cron daily.
 * It lists all files in Vercel Blob and deletes those older than 15 days.
 *
 * Schedule: Runs daily at 3 AM (configured in vercel.json)
 */

import { NextResponse } from 'next/server'
import { list, del } from '@vercel/blob'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds is the max for hobby/pro usually

export async function POST(request: Request) {
  try {
    // 1. Verify cron secret (Security)
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[CRON:CLEANUP-BLOB] CRON_SECRET not configured')
      return NextResponse.json(
        { message: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[CRON:CLEANUP-BLOB] Unauthorized access attempt', {
        ip: request.headers.get('x-forwarded-for'),
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🧹 Starting Vercel Blob cleanup cron job...')

    // Calculate the cutoff date (15 days ago)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 15)
    console.log(`📅 Deleting files uploaded before: ${cutoffDate.toISOString()}`)

    let cursor: string | undefined
    let hasMore = true
    let deletedCount = 0
    let scannedCount = 0

    // Loop to paginate through all blobs
    while (hasMore) {
      const listResult = await list({
        cursor,
        limit: 1000,
      })

      hasMore = listResult.hasMore
      cursor = listResult.cursor

      const blobsToDelete = []

      for (const blob of listResult.blobs) {
        scannedCount++
        if (blob.uploadedAt < cutoffDate) {
          blobsToDelete.push(blob.url)
        }
      }

      if (blobsToDelete.length > 0) {
        // Delete in batches to avoid hitting API limits
        // @vercel/blob `del` can take an array of URLs
        await del(blobsToDelete)
        deletedCount += blobsToDelete.length
        console.log(`🗑️ Deleted ${blobsToDelete.length} files in this batch.`)
      }
    }

    console.log('✅ Vercel Blob cleanup completed')
    console.log(`📊 Scanned: ${scannedCount} files`)
    console.log(`🗑️ Total deleted: ${deletedCount} files`)

    return NextResponse.json({
      message: 'Vercel Blob cleanup completed',
      scanned: scannedCount,
      deleted: deletedCount,
    })
  } catch (error) {
    console.error('❌ Vercel Blob cleanup error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
