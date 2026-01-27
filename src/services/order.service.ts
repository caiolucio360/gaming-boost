/**
 * Order Service
 * Centralized business logic for order management
 *
 * Uses Result<T> pattern for consistent error handling
 */

import { prisma } from '@/lib/db'
import { OrderStatus } from '@/generated/prisma/client'
import { Result, Success, Failure, success, failure, PaginatedResult, paginatedSuccess } from './types'
import { sendOrderAcceptedEmail, sendOrderCompletedEmail } from '@/lib/email'

// ============================================================================
// Types
// ============================================================================

interface GetOrdersParams {
  userId?: number
  boosterId?: number
  status?: OrderStatus
  gameMode?: string
  page?: number
  limit?: number
}

interface CreateOrderInput {
  userId: number
  game?: 'CS2'
  total: number
  currentRank?: string
  targetRank?: string
  currentRating?: number
  targetRating?: number
  gameMode?: string
  gameType?: string
  metadata?: string
  steamCredentials?: string
  steamProfileUrl?: string
  steamConsent?: boolean
}

interface AcceptOrderInput {
  orderId: number
  boosterId: number
}

interface CompleteOrderInput {
  orderId: number
  boosterId: number
}

interface OrderWithRelations {
  id: number
  userId: number
  game: string
  boosterId: number | null
  status: OrderStatus
  total: number
  currentRank: string | null
  targetRank: string | null
  currentRating: number | null
  targetRating: number | null
  gameMode: string | null
  gameType: string | null
  createdAt: Date
  updatedAt: Date
  user?: {
    id: number
    name: string | null
    email: string
  }
  booster?: {
    id: number
    name: string | null
    email: string
  } | null
}

interface CommissionResult {
  boosterCommission: number
  boosterPercentage: number
  adminRevenue: number
  adminPercentage: number
  devAdminRevenue: number
  devAdminPercentage: number
}

// ============================================================================
// OrderService
// ============================================================================

export const OrderService = {
  // --------------------------------------------------------------------------
  // Query Operations
  // --------------------------------------------------------------------------

  /**
   * Get orders with optional filters and pagination
   */
  async getOrders(params: GetOrdersParams): Promise<Result<PaginatedResult<OrderWithRelations>>> {
    const { userId, boosterId, status, gameMode, page = 1, limit = 10 } = params

    try {
      const where: Record<string, unknown> = {}
      if (userId) where.userId = userId
      if (boosterId) where.boosterId = boosterId
      if (status) where.status = status
      if (gameMode) where.gameMode = gameMode

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            booster: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.order.count({ where }),
      ])

      return paginatedSuccess(orders as OrderWithRelations[], total, page, limit)
    } catch (error) {
      console.error('Error getting orders:', error)
      return failure('Erro ao buscar pedidos', 'DATABASE_ERROR')
    }
  },

  /**
   * Get a single order by ID with full relations
   */
  async getOrderById(orderId: number): Promise<Result<OrderWithRelations | null>> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          booster: {
            select: { id: true, name: true, email: true },
          },
          payments: true,
          review: true,
        },
      })

      return success(order as OrderWithRelations | null)
    } catch (error) {
      console.error('Error getting order by ID:', error)
      return failure('Erro ao buscar pedido', 'DATABASE_ERROR')
    }
  },

  /**
   * Get user's orders for a specific game (CS2)
   */
  async getUserCS2Orders(userId: number): Promise<Result<OrderWithRelations[]>> {
    try {
      const orders = await prisma.order.findMany({
        where: {
          userId,
          game: 'CS2',
        },
        include: {
          review: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return success(orders as OrderWithRelations[])
    } catch (error) {
      console.error('Error getting user CS2 orders:', error)
      return failure('Erro ao buscar pedidos', 'DATABASE_ERROR')
    }
  },

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  /**
   * Check if user has an active order in the same game mode
   */
  async hasActiveOrderInGameMode(userId: number, gameMode: string): Promise<Result<{ hasActive: boolean; orderId?: number }>> {
    try {
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId,
          status: { in: [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.IN_PROGRESS] },
          gameMode,
        },
        select: { id: true, status: true },
      })

      if (existingOrder) {
        return success({ hasActive: true, orderId: existingOrder.id })
      }

      return success({ hasActive: false })
    } catch (error) {
      console.error('Error checking active order:', error)
      return failure('Erro ao verificar pedidos ativos', 'DATABASE_ERROR')
    }
  },

  /**
   * Check if booster has an active order
   */
  async boosterHasActiveOrder(boosterId: number): Promise<Result<{ hasActive: boolean; orderId?: number }>> {
    try {
      const activeOrder = await prisma.order.findFirst({
        where: {
          boosterId,
          status: { in: [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.IN_PROGRESS] },
        },
        select: { id: true, status: true },
      })

      if (activeOrder) {
        return success({ hasActive: true, orderId: activeOrder.id })
      }

      return success({ hasActive: false })
    } catch (error) {
      console.error('Error checking booster active order:', error)
      return failure('Erro ao verificar pedidos ativos do booster', 'DATABASE_ERROR')
    }
  },

  /**
   * Validate order status transition
   */
  canTransitionStatus(from: OrderStatus, to: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
      PAID: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
      IN_PROGRESS: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      COMPLETED: [],
      CANCELLED: [],
    }

    return validTransitions[from]?.includes(to) ?? false
  },

  // --------------------------------------------------------------------------
  // Commission Calculation
  // --------------------------------------------------------------------------

  /**
   * Get commission configuration for a booster
   */
  async getCommissionConfig(boosterId?: number): Promise<Result<{ boosterPercentage: number; adminPercentage: number; devAdminPercentage: number }>> {
    try {
      const config = await prisma.commissionConfig.findFirst({
        where: { enabled: true },
      })

      // Default values
      let boosterPercentage = 0.70
      let adminPercentage = 0.30
      let devAdminPercentage = 0

      if (config) {
        boosterPercentage = config.boosterPercentage
        adminPercentage = config.adminPercentage
        devAdminPercentage = config.devAdminPercentage || 0
      }

      // Check for custom booster commission (overrides global booster %)
      if (boosterId) {
        const booster = await prisma.user.findUnique({
          where: { id: boosterId },
          select: { boosterCommissionPercentage: true },
        })

        if (booster?.boosterCommissionPercentage !== null && booster?.boosterCommissionPercentage !== undefined) {
          boosterPercentage = booster.boosterCommissionPercentage
          // Recalculate admin percentage based on remaining AFTER dev admin cut
          // Note context: adminPercentage used to be 1 - booster. Now it depends on the base.
          // But wait, the split logic is: Total -> Dev -> Remaining -> Booster/Admin
          // So Booster % applies to Remaining.
          adminPercentage = 1 - boosterPercentage
        }
      }

      return success({
        boosterPercentage,
        adminPercentage,
        devAdminPercentage,
      })
    } catch (error) {
      console.error('Error getting commission config:', error)
      return failure('Erro ao buscar configuração de comissão', 'DATABASE_ERROR')
    }
  },

  /**
   * Calculate commission split for an order
   */
  calculateCommission(total: number, boosterPercentage: number, adminPercentage: number, devAdminPercentage: number): CommissionResult {
    // 1. Dev-Admin takes cut first
    const devAdminRevenue = total * devAdminPercentage
    const remaining = total - devAdminRevenue

    // 2. Booster and Admin split the REMAINING amount
    const boosterCommission = remaining * boosterPercentage
    const adminRevenue = remaining * adminPercentage

    return {
      devAdminRevenue: Math.round(devAdminRevenue * 100) / 100,
      devAdminPercentage,
      boosterCommission: Math.round(boosterCommission * 100) / 100,
      boosterPercentage,
      adminRevenue: Math.round(adminRevenue * 100) / 100,
      adminPercentage,
    }
  },

  // --------------------------------------------------------------------------
  // Order Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new order with validation
   */
  async createOrder(input: CreateOrderInput): Promise<Result<OrderWithRelations>> {
    const { userId, game = 'CS2', total, gameMode, ...rest } = input

    try {
      // Check for duplicate orders in same game mode
      if (gameMode && (gameMode === 'PREMIER' || gameMode === 'GAMERS_CLUB')) {
        const activeCheck = await this.hasActiveOrderInGameMode(userId, gameMode)
        if (!activeCheck.success) {
          return activeCheck as Failure
        }
        if (activeCheck.data.hasActive) {
          const modeName = gameMode === 'PREMIER' ? 'Premier' : 'Gamers Club'
          return failure(
            `Você já possui um boost de rank ${modeName} ativo. Finalize ou cancele o pedido anterior antes de criar um novo.`,
            'DUPLICATE_ORDER'
          )
        }
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          userId,
          game,
          total,
          status: OrderStatus.PENDING,
          gameMode,
          ...rest,
        },
      })

      return success(order as OrderWithRelations)
    } catch (error) {
      console.error('Error creating order:', error)
      return failure('Erro ao criar pedido', 'DATABASE_ERROR')
    }
  },

  /**
   * Booster accepts an order - creates commissions and updates status
   */
  async acceptOrder(input: AcceptOrderInput): Promise<Result<OrderWithRelations>> {
    const { orderId, boosterId } = input

    try {
      // Fetch order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, total: true, status: true, boosterId: true, userId: true },
      })

      if (!order) {
        return failure('Pedido não encontrado', 'ORDER_NOT_FOUND')
      }

      if (order.status !== OrderStatus.PAID) {
        return failure('Pedido não está pago e disponível para aceitação', 'INVALID_STATUS_TRANSITION')
      }

      if (order.boosterId) {
        return failure('Pedido já foi atribuído a outro booster', 'ORDER_ALREADY_ACCEPTED')
      }

      // Check if booster already has an active order
      const activeCheck = await this.boosterHasActiveOrder(boosterId)
      if (!activeCheck.success) {
        return activeCheck as Failure
      }
      if (activeCheck.data.hasActive) {
        return failure(
          `Você já possui um pedido ativo (ID: ${activeCheck.data.orderId}). Finalize-o antes de aceitar um novo.`,
          'DUPLICATE_ORDER'
        )
      }

      // Get commission config
      const configResult = await this.getCommissionConfig(boosterId)
      if (!configResult.success) {
        return configResult as Failure
      }
      const { boosterPercentage, adminPercentage, devAdminPercentage } = configResult.data
      const commission = this.calculateCommission(order.total, boosterPercentage, adminPercentage, devAdminPercentage)

      // Execute transaction
      const updatedOrder = await prisma.$transaction(async (tx: any) => {
        // Atomically update order (with race condition protection)
        const updateResult = await tx.order.updateMany({
          where: {
            id: orderId,
            status: OrderStatus.PAID,
            boosterId: null,
          },
          data: {
            boosterId,
            status: OrderStatus.IN_PROGRESS,
          },
        })

        if (updateResult.count === 0) {
          throw new Error('ORDER_ALREADY_ACCEPTED')
        }

        // Create booster commission
        await tx.boosterCommission.create({
          data: {
            orderId,
            boosterId,
            orderTotal: order.total,
            percentage: boosterPercentage,
            amount: commission.boosterCommission,
            status: 'PENDING',
          },
        })

        // Create dev-admin revenue (if applicable)
        if (commission.devAdminRevenue > 0) {
          // Find dev-admin user
          const devAdmin = await tx.user.findFirst({
            where: { isDevAdmin: true },
            select: { id: true }
          })

          if (devAdmin) {
            await tx.devAdminRevenue.create({
              data: {
                orderId,
                devAdminId: devAdmin.id,
                orderTotal: order.total,
                percentage: devAdminPercentage,
                amount: commission.devAdminRevenue,
                status: 'PENDING',
              },
            })
          }
        }

        // Distribute admin revenue among all active admins (excluding dev-admin logic handled usually by role, but here we split remaining)
        // Note: AdminRevenue is for "regular" admin profit share. Dev-admin revenue is separate.
        const admins = await tx.user.findMany({
          where: { role: 'ADMIN', active: true },
          select: { id: true, adminProfitShare: true },
        })

        if (admins.length > 0) {
          const totalShares = admins.reduce((sum: number, admin: { id: number; adminProfitShare: number | null }) => sum + (admin.adminProfitShare || 0), 0)

          for (const admin of admins) {
            const sharePercentage = totalShares > 0
              ? (admin.adminProfitShare || 0) / totalShares
              : 1 / admins.length

            const adminAmount = commission.adminRevenue * sharePercentage

            await tx.adminRevenue.create({
              data: {
                orderId,
                adminId: admin.id,
                orderTotal: order.total,
                percentage: adminPercentage * sharePercentage,
                amount: adminAmount,
                status: 'PENDING',
              },
            })
          }
        }

        // Fetch updated order with relations
        return await tx.order.findUnique({
          where: { id: orderId },
          include: {
            user: { select: { id: true, name: true, email: true } },
            booster: { select: { id: true, name: true, email: true } },
          },
        })
      })

      if (!updatedOrder) {
        return failure('Erro ao buscar pedido atualizado', 'DATABASE_ERROR')
      }

      // Send email notification (async, non-blocking)
      if (updatedOrder.user?.email && updatedOrder.booster?.name) {
        const serviceName = updatedOrder.gameMode ? `CS2 ${updatedOrder.gameMode}` : 'Boost CS2'
        sendOrderAcceptedEmail(
          updatedOrder.user.email,
          updatedOrder.id,
          serviceName,
          updatedOrder.booster.name
        ).catch((error) => {
          console.error('Failed to send order accepted email:', error)
        })
      }

      return success(updatedOrder as OrderWithRelations)
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'ORDER_ALREADY_ACCEPTED') {
        return failure('Pedido já foi atribuído a outro booster', 'ORDER_ALREADY_ACCEPTED')
      }
      console.error('Error accepting order:', error)
      return failure('Erro ao aceitar pedido', 'DATABASE_ERROR')
    }
  },

  /**
   * Booster completes an order - releases commissions
   */
  async completeOrder(input: CompleteOrderInput): Promise<Result<OrderWithRelations>> {
    const { orderId, boosterId } = input

    try {
      // Verify order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, boosterId: true },
      })

      if (!order) {
        return failure('Pedido não encontrado', 'ORDER_NOT_FOUND')
      }

      if (order.boosterId !== boosterId) {
        return failure('Acesso negado. Este pedido não foi atribuído a você.', 'FORBIDDEN')
      }

      if (order.status !== OrderStatus.IN_PROGRESS) {
        return failure('Pedido não está em andamento', 'INVALID_STATUS_TRANSITION')
      }

      // Execute transaction
      const updatedOrder = await prisma.$transaction(async (tx: any) => {
        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.COMPLETED },
        })

        // Release booster commission
        await tx.boosterCommission.updateMany({
          where: { orderId, status: 'PENDING' },
          data: { status: 'PAID', paidAt: new Date() },
        })

        // Release admin revenue
        await tx.adminRevenue.updateMany({
          where: { orderId, status: 'PENDING' },
          data: { status: 'PAID', paidAt: new Date() },
        })

        // Release dev-admin revenue
        await tx.devAdminRevenue.updateMany({
          where: { orderId, status: 'PENDING' },
          data: { status: 'PAID', paidAt: new Date() },
        })

        // Return updated order with relations
        return await tx.order.findUnique({
          where: { id: orderId },
          include: {
            user: { select: { id: true, name: true, email: true } },
            booster: { select: { id: true, name: true, email: true } },
          },
        })
      })

      if (!updatedOrder) {
        return failure('Erro ao buscar pedido atualizado', 'DATABASE_ERROR')
      }

      // Send email notification (async, non-blocking)
      if (updatedOrder.user?.email) {
        const serviceName = updatedOrder.gameMode ? `CS2 ${updatedOrder.gameMode}` : 'Boost CS2'
        sendOrderCompletedEmail(
          updatedOrder.user.email,
          updatedOrder.id,
          serviceName
        ).catch((error) => {
          console.error('Failed to send order completed email:', error)
        })
      }

      return success(updatedOrder as OrderWithRelations)
    } catch (error) {
      console.error('Error completing order:', error)
      return failure('Erro ao concluir pedido', 'DATABASE_ERROR')
    }
  },

  /**
   * Update order status with validation
   */
  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<Result<OrderWithRelations>> {
    try {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      })

      if (!existingOrder) {
        return failure('Pedido não encontrado', 'ORDER_NOT_FOUND')
      }

      if (!this.canTransitionStatus(existingOrder.status, status)) {
        return failure(
          `Transição de ${existingOrder.status} para ${status} não permitida`,
          'INVALID_STATUS_TRANSITION'
        )
      }

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          user: { select: { id: true, name: true, email: true } },
          booster: { select: { id: true, name: true, email: true } },
        },
      })

      return success(order as OrderWithRelations)
    } catch (error) {
      console.error('Error updating order status:', error)
      return failure('Erro ao atualizar status do pedido', 'DATABASE_ERROR')
    }
  },

  /**
   * Cancel an order (with optional refund handling)
   */
  async cancelOrder(orderId: number, userId: number): Promise<Result<OrderWithRelations>> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, status: true },
      })

      if (!order) {
        return failure('Pedido não encontrado', 'ORDER_NOT_FOUND')
      }

      if (order.userId !== userId) {
        return failure('Pedido não pertence ao usuário', 'FORBIDDEN')
      }

      if (!this.canTransitionStatus(order.status, OrderStatus.CANCELLED)) {
        return failure('Este pedido não pode ser cancelado', 'ORDER_NOT_CANCELLABLE')
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: {
          user: { select: { id: true, name: true, email: true } },
          booster: { select: { id: true, name: true, email: true } },
        },
      })

      return success(updatedOrder as OrderWithRelations)
    } catch (error) {
      console.error('Error cancelling order:', error)
      return failure('Erro ao cancelar pedido', 'DATABASE_ERROR')
    }
  },
}
