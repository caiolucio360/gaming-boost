import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiHandler } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { HttpStatus } from '@/lib/http-status'

export const GET = withApiHandler(
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where = {
      userId: user.id,
      ...(unreadOnly ? { read: false } : {}),
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: user.id,
          read: false,
        },
      }),
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      unreadCount,
    })
  },
  {
    auth: true,
    errorMessage: ErrorMessages.GENERIC_ERROR,
    endpoint: 'GET /api/notifications',
  }
)

export const PATCH = withApiHandler(
  async ({ request, user }) => {
    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: { read: true },
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
        },
        data: { read: true },
      })
    } else {
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    return NextResponse.json({ success: true })
  },
  {
    auth: true,
    errorMessage: ErrorMessages.GENERIC_ERROR,
    endpoint: 'PATCH /api/notifications',
  }
)
