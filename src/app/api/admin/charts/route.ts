import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatDay(dateKey: string) {
  const [, month, day] = dateKey.split('-')
  return `${day}/${month}`
}

export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request)
  if (!authResult.authenticated) return createAuthErrorResponseFromResult(authResult)

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  // Build list of all 30 days for filling gaps
  const allDays: string[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(thirtyDaysAgo.getDate() + i)
    allDays.push(toDateKey(d))
  }

  const [orders, newUsers] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, total: true, status: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, isDevAdmin: false },
      select: { createdAt: true },
    }),
  ])

  // --- Revenue & orders per day ---
  const dayMap: Record<string, { revenue: number; orders: number }> = {}
  for (const day of allDays) dayMap[day] = { revenue: 0, orders: 0 }

  for (const o of orders) {
    const key = toDateKey(new Date(o.createdAt))
    if (dayMap[key]) {
      dayMap[key].orders++
      if (o.status === 'COMPLETED') dayMap[key].revenue += o.total
    }
  }

  const timeSeries = allDays.map((day) => ({
    day: formatDay(day),
    receita: Math.round(dayMap[day].revenue) / 100,
    pedidos: dayMap[day].orders,
  }))

  // --- New users per day ---
  const userDayMap: Record<string, number> = {}
  for (const day of allDays) userDayMap[day] = 0
  for (const u of newUsers) {
    const key = toDateKey(new Date(u.createdAt))
    if (userDayMap[key] !== undefined) userDayMap[key]++
  }
  const userSeries = allDays.map((day) => ({
    day: formatDay(day),
    usuarios: userDayMap[day],
  }))

  // --- Orders by status ---
  const statusCount = { PENDING: 0, PAID: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 }
  const allOrders = await prisma.order.groupBy({
    by: ['status'],
    _count: { status: true },
  })
  for (const row of allOrders) {
    if (row.status in statusCount) statusCount[row.status as keyof typeof statusCount] = row._count.status
  }

  const statusChart = [
    { name: 'Pendente',     value: statusCount.PENDING,     color: '#F59E0B' },
    { name: 'Pago',         value: statusCount.PAID,        color: '#3B82F6' },
    { name: 'Em Progresso', value: statusCount.IN_PROGRESS, color: '#A855F7' },
    { name: 'Concluído',    value: statusCount.COMPLETED,   color: '#10B981' },
    { name: 'Cancelado',    value: statusCount.CANCELLED,   color: '#EF4444' },
  ].filter((s) => s.value > 0)

  return NextResponse.json({ timeSeries, userSeries, statusChart }, { status: 200 })
}
