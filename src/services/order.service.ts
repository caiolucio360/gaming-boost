/**
 * Order Service
 * Contains business logic for order management
 */

import { prisma } from '@/lib/db'

// String literal type that matches both Zod schema and Prisma enum
type OrderStatusValue =
    | 'PENDING'
    | 'PAID'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'DISPUTED'

type OrderResult<T> =
    | { success: true; order: T }
    | { success: false; error: string }

type OrdersResult<T> =
    | { success: true; orders: T[] }
    | { success: false; error: string }

interface GetOrdersParams {
    userId?: number
    boosterId?: number
    status?: OrderStatusValue
    page?: number
    limit?: number
}

interface CreateOrderInput {
    serviceId: number
    userId: number
    total: number
    currentRank?: string
    targetRank?: string
    currentLevel?: number
    targetLevel?: number
    notes?: string
    gameCredentials?: string
    boosterId?: number
}

/**
 * OrderService handles all order-related business logic
 */
export const OrderService = {
    /**
     * Get orders with optional filters
     */
    async getOrders(params: GetOrdersParams): Promise<OrdersResult<unknown>> {
        const { userId, boosterId, status, page = 1, limit = 10 } = params

        const where: Record<string, unknown> = {}
        if (userId) where.userId = userId
        if (boosterId) where.boosterId = boosterId
        if (status) where.status = status

        const orders = await prisma.order.findMany({
            where,
            include: {
                service: {
                    select: { id: true, name: true, game: true },
                },
                booster: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        })

        return { success: true, orders }
    },

    /**
     * Get a single order by ID
     */
    async getOrderById(orderId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                service: true,
                user: {
                    select: { id: true, name: true, email: true },
                },
                booster: {
                    select: { id: true, name: true },
                },
                payments: true,
            },
        })

        return order
    },

    /**
     * Create a new order
     */
    async createOrder(input: CreateOrderInput): Promise<OrderResult<unknown>> {
        const { serviceId, userId, total, ...rest } = input

        // Verify service exists
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        })

        if (!service) {
            return { success: false, error: 'Serviço não encontrado' }
        }

        // Create order with explicit status cast
        const order = await prisma.order.create({
            data: {
                serviceId,
                userId,
                total,
                status: 'PENDING' as unknown as never,
                ...rest,
            },
            include: {
                service: {
                    select: { id: true, name: true },
                },
            },
        })

        return { success: true, order }
    },

    /**
     * Update order status
     */
    async updateOrderStatus(
        orderId: number,
        status: OrderStatusValue
    ): Promise<OrderResult<unknown>> {
        // Check if order exists
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
        })

        if (!existingOrder) {
            return { success: false, error: 'Pedido não encontrado' }
        }

        // Update status - use unknown cast for Prisma compatibility
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status: status as unknown as never },
        })

        return { success: true, order }
    },

    /**
     * Assign a booster to an order
     */
    async assignBooster(
        orderId: number,
        boosterId: number
    ): Promise<OrderResult<unknown>> {
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
        })

        if (!existingOrder) {
            return { success: false, error: 'Pedido não encontrado' }
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                boosterId,
                status: 'IN_PROGRESS' as unknown as never,
            },
        })

        return { success: true, order }
    },
}
