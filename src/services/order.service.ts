/**
 * Order Service
 * Centralized business logic for order management
 *
 * Uses Result<T> pattern for consistent error handling
 */

import { prisma } from '@/lib/db'
import { OrderStatus } from '@/generated/prisma/client'
import { Result, Failure, success, failure, ErrorCode, PaginatedResult, paginatedSuccess } from './types'
import { ErrorCodes, ErrorMessages } from '@/lib/error-constants'
import { sendOrderAcceptedEmail, sendOrderCompletedEmail } from '@/lib/email'
import { encrypt } from '@/lib/encryption'
import { ChatService } from './chat.service'
import { bestAvailableDiscount, updateUserStreak } from '@/lib/retention'
import { getNextMilestone, calculateProgressPct } from '@/lib/retention-utils'

/**
 * Erro de serviço tipado com código estruturado.
 * Usado internamente para controle de fluxo via instanceof — sem string matching.
 */
class ServiceError extends Error {
  constructor(message: string, public code: ErrorCode) {
    super(message)
    this.name = 'ServiceError'
  }
}

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
  serviceType?: 'RANK_BOOST' | 'DUO_BOOST'
  total: number
  currentRank?: string
  targetRank?: string
  currentRating?: number
  targetRating?: number
  gameMode?: string
  gameType?: string
  metadata?: string
}

interface AcceptOrderInput {
  orderId: number
  boosterId: number
}

interface CompleteOrderInput {
  orderId: number
  boosterId: number
  completionProofUrl: string
}

interface StartOrderInput {
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
      return failure('Erro ao buscar pedidos', ErrorCodes.DATABASE_ERROR)
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
        },
      })

      return success(order as OrderWithRelations | null)
    } catch (error) {
      console.error('Error getting order by ID:', error)
      return failure('Erro ao buscar pedido', ErrorCodes.DATABASE_ERROR)
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
        },
        orderBy: { createdAt: 'desc' },
      })

      return success(orders as OrderWithRelations[])
    } catch (error) {
      console.error('Error getting user CS2 orders:', error)
      return failure('Erro ao buscar pedidos', ErrorCodes.DATABASE_ERROR)
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
      return failure('Erro ao verificar pedidos ativos', ErrorCodes.DATABASE_ERROR)
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
      return failure('Erro ao verificar pedidos ativos do booster', ErrorCodes.DATABASE_ERROR)
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

      if (!config) {
        return failure('Configuração de comissão não encontrada. Execute o seed do banco de dados.', ErrorCodes.DATABASE_ERROR)
      }

      let boosterPercentage = config.boosterPercentage
      const devAdminPercentage = config.devAdminPercentage || 0
      // adminPercentage is always derived — never read from DB
      let adminPercentage = 1 - boosterPercentage

      // Per-booster override: if set, use it; admin gets the remainder
      if (boosterId) {
        const booster = await prisma.user.findUnique({
          where: { id: boosterId },
          select: { boosterCommissionPercentage: true },
        })

        if (booster?.boosterCommissionPercentage !== null && booster?.boosterCommissionPercentage !== undefined) {
          boosterPercentage = booster.boosterCommissionPercentage
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
      return failure('Erro ao buscar configuração de comissão', ErrorCodes.DATABASE_ERROR)
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
    const { userId, game = 'CS2', serviceType = 'RANK_BOOST', total, gameMode, ...rest } = input

    try {
      // Check for duplicate orders in same game mode (only 1 active per mode regardless of service type)
      if (gameMode && (gameMode === 'PREMIER' || gameMode === 'GAMERS_CLUB')) {
        const activeCheck = await this.hasActiveOrderInGameMode(userId, gameMode)
        if (!activeCheck.success) {
          return activeCheck as Failure
        }
        if (activeCheck.data.hasActive) {
          const modeName = gameMode === 'PREMIER' ? 'Premier' : 'Gamers Club'
          return failure(
            `Você já possui um boost de rank ${modeName} ativo. Finalize ou cancele o pedido anterior antes de criar um novo.`,
            ErrorCodes.DUPLICATE_ORDER
          )
        }
      }

      // Fetch user discount fields
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          currentDiscountPct: true,
          reactivationDiscountPct: true,
          reactivationDiscountExpiresAt: true,
        },
      })

      // Compute best available discount
      const discountPct = user
        ? bestAvailableDiscount(
            user.currentDiscountPct ?? 0,
            user.reactivationDiscountPct ?? 0,
            user.reactivationDiscountExpiresAt ?? null
          )
        : 0
      const discountedTotal = discountPct > 0
        ? Math.round(total * (1 - discountPct) * 100) / 100
        : total

      // Create order
      const order = await prisma.order.create({
        data: {
          userId,
          game,
          serviceType,
          total: discountedTotal,
          discountApplied: discountPct > 0,
          discountPct: discountPct,
          status: OrderStatus.PENDING,
          gameMode,
          ...rest,
        },
      })

      // Clear reactivation discount if it was used
      if (discountPct > 0 && (user?.reactivationDiscountPct ?? 0) > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            reactivationDiscountPct: 0,
            reactivationDiscountExpiresAt: null,
          },
        })
      }

      return success(order as OrderWithRelations)
    } catch (error) {
      console.error('Error creating order:', error)
      return failure('Erro ao criar pedido', ErrorCodes.DATABASE_ERROR)
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
        return failure(ErrorMessages.ORDER_NOT_FOUND, ErrorCodes.ORDER_NOT_FOUND)
      }

      if (order.status !== OrderStatus.PAID) {
        return failure(ErrorMessages.ORDER_NOT_PAID, ErrorCodes.INVALID_STATUS_TRANSITION)
      }

      if (order.boosterId) {
        return failure(ErrorMessages.ORDER_ALREADY_ACCEPTED, ErrorCodes.ORDER_ALREADY_ACCEPTED)
      }

      // Check if booster has a PIX key registered
      const boosterUser = await prisma.user.findUnique({
        where: { id: boosterId },
        select: { pixKey: true },
      })
      if (!boosterUser?.pixKey) {
        return failure(ErrorMessages.ORDER_PIX_KEY_REQUIRED, ErrorCodes.PIX_KEY_REQUIRED)
      }

      // Check if booster already has an active order
      const activeCheck = await this.boosterHasActiveOrder(boosterId)
      if (!activeCheck.success) {
        return activeCheck as Failure
      }
      if (activeCheck.data.hasActive) {
        return failure(
          `Você já possui um pedido ativo (ID: ${activeCheck.data.orderId}). Finalize-o antes de aceitar um novo.`,
          ErrorCodes.DUPLICATE_ORDER
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
            // Status stays PAID — booster must start separately after client shares credentials
          },
        })

        if (updateResult.count === 0) {
          throw new ServiceError(ErrorMessages.ORDER_ALREADY_ACCEPTED, ErrorCodes.ORDER_ALREADY_ACCEPTED)
        }

        // Auto-create chat and post system message asking for credentials
        const existingChat = await tx.orderChat.findUnique({ where: { orderId }, select: { id: true } })
        let chatId: number
        if (existingChat) {
          chatId = existingChat.id
        } else {
          const newChat = await tx.orderChat.create({
            data: { orderId, isActive: true },
            select: { id: true },
          })
          chatId = newChat.id
        }
        await tx.orderMessage.create({
          data: {
            chatId,
            authorId: boosterId,
            content: encrypt(
              'Olá! Sou seu booster. Por favor, envie suas credenciais Steam (usuário e senha) pelo botão abaixo para que eu possa iniciar o boost.'
            ),
            isEncrypted: true,
            messageType: 'TEXT',
          },
        })

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
        return failure('Erro ao buscar pedido atualizado', ErrorCodes.DATABASE_ERROR)
      }

      // Create notification for client that booster accepted order
      if (updatedOrder.user?.id && updatedOrder.booster?.name) {
        prisma.notification.create({
          data: {
            userId: updatedOrder.user.id,
            type: 'BOOSTER_ASSIGNED',
            title: 'Booster Atribuído!',
            message: `${updatedOrder.booster.name} aceitou seu pedido #${orderId}. Envie suas credenciais Steam pelo chat para iniciar o boost.`,
            metadata: JSON.stringify({ orderId, boosterId }),
          },
        }).catch((error) => {
          console.error('Failed to create notification for order accepted:', error)
        })
      }

      return success(updatedOrder as OrderWithRelations)
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        return failure(error.message, error.code)
      }
      console.error('Error accepting order:', error)
      return failure('Erro ao aceitar pedido', ErrorCodes.DATABASE_ERROR)
    }
  },

  /**
   * Booster starts an order - transitions PAID → IN_PROGRESS after credentials are shared
   */
  async startOrder(input: StartOrderInput): Promise<Result<OrderWithRelations>> {
    const { orderId, boosterId } = input

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, boosterId: true, userId: true, gameMode: true },
      })

      if (!order) {
        return failure(ErrorMessages.ORDER_NOT_FOUND, ErrorCodes.ORDER_NOT_FOUND)
      }

      if (order.boosterId !== boosterId) {
        return failure(ErrorMessages.ORDER_ACCESS_DENIED, ErrorCodes.FORBIDDEN)
      }

      if (order.status !== OrderStatus.PAID) {
        return failure(ErrorMessages.ORDER_NOT_PAID, ErrorCodes.INVALID_STATUS_TRANSITION)
      }

      // Validate that credentials have been shared in chat
      const credResult = await ChatService.hasCredentials(orderId)
      if (!credResult.success) {
        return credResult as Failure
      }
      if (!credResult.data.hasCredentials) {
        return failure(ErrorMessages.ORDER_CREDENTIALS_REQUIRED, ErrorCodes.CREDENTIALS_REQUIRED)
      }

      // Transition to IN_PROGRESS
      const updatedOrder = await prisma.$transaction(async (tx: any) => {
        const updateResult = await tx.order.updateMany({
          where: { id: orderId, status: OrderStatus.PAID, boosterId },
          data: { status: OrderStatus.IN_PROGRESS },
        })

        if (updateResult.count === 0) {
          throw new ServiceError('Pedido não pôde ser iniciado', ErrorCodes.INVALID_STATUS_TRANSITION)
        }

        return tx.order.findUnique({
          where: { id: orderId },
          include: {
            user: { select: { id: true, name: true, email: true } },
            booster: { select: { id: true, name: true, email: true } },
          },
        })
      })

      if (!updatedOrder) {
        return failure('Erro ao buscar pedido atualizado', ErrorCodes.DATABASE_ERROR)
      }

      // Send email to client that boost has started
      if (updatedOrder.user?.email && updatedOrder.booster?.name) {
        const serviceName = updatedOrder.gameMode ? `CS2 ${updatedOrder.gameMode}` : 'Boost CS2'
        sendOrderAcceptedEmail(
          updatedOrder.user.email,
          updatedOrder.id,
          serviceName,
          updatedOrder.booster.name
        ).catch((error) => {
          console.error('Failed to send order started email:', error)
        })
      }

      // Notify client
      if (updatedOrder.user?.id) {
        prisma.notification.create({
          data: {
            userId: updatedOrder.user.id,
            type: 'ORDER_UPDATE',
            title: 'Boost Iniciado!',
            message: `Seu pedido #${orderId} foi iniciado. Acompanhe o progresso pelo chat.`,
            metadata: JSON.stringify({ orderId }),
          },
        }).catch((error) => {
          console.error('Failed to create start notification:', error)
        })
      }

      return success(updatedOrder as OrderWithRelations)
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        return failure(error.message, error.code)
      }
      console.error('Error starting order:', error)
      return failure('Erro ao iniciar pedido', ErrorCodes.DATABASE_ERROR)
    }
  },

  /**
   * Booster completes an order - releases commissions
   */
  async completeOrder(input: CompleteOrderInput): Promise<Result<OrderWithRelations>> {
    const { orderId, boosterId, completionProofUrl } = input

    try {
      // Verify order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, boosterId: true },
      })

      if (!order) {
        return failure(ErrorMessages.ORDER_NOT_FOUND, ErrorCodes.ORDER_NOT_FOUND)
      }

      if (order.boosterId !== boosterId) {
        return failure(ErrorMessages.ORDER_ACCESS_DENIED, ErrorCodes.FORBIDDEN)
      }

      if (order.status !== OrderStatus.IN_PROGRESS) {
        return failure(ErrorMessages.ORDER_NOT_IN_PROGRESS, ErrorCodes.INVALID_STATUS_TRANSITION)
      }

      // Fetch withdrawal waiting days config
      const config = await prisma.commissionConfig.findFirst({
        where: { enabled: true },
        select: { withdrawalWaitingDays: true },
      })
      const waitingDays = config?.withdrawalWaitingDays ?? 7

      // Execute transaction
      const updatedOrder = await prisma.$transaction(async (tx: any) => {
        // Update order status with completion proof
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.COMPLETED, completionProofUrl },
        })

        // Release booster commission with withdrawal availability date
        const paidAt = new Date()
        const availableForWithdrawalAt = waitingDays === 0
          ? paidAt
          : new Date(paidAt.getTime() + waitingDays * 24 * 60 * 60 * 1000)

        await tx.boosterCommission.updateMany({
          where: { orderId, status: 'PENDING' },
          data: { status: 'PAID', paidAt, availableForWithdrawalAt },
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
        return failure('Erro ao buscar pedido atualizado', ErrorCodes.DATABASE_ERROR)
      }

      // Wipe Steam credentials from chat (non-blocking, best-effort)
      ChatService.wipeSteamCredentials(orderId).catch((error) => {
        console.error('Failed to wipe Steam credentials:', error)
      })

      // Update streak (needed before email so we can pass discount data)
      let streakResult = { newStreak: 0, leveledUp: false, newDiscountPct: 0 }
      if (updatedOrder.user?.id) {
        streakResult = await updateUserStreak(updatedOrder.user.id)
      }

      // Send email notification (async, non-blocking)
      if (updatedOrder.user?.email) {
        const serviceName = updatedOrder.gameMode ? `CS2 ${updatedOrder.gameMode}` : 'Boost CS2'
        const currentRating = updatedOrder.targetRating ?? 0
        const rawGameMode = updatedOrder.gameMode ?? ''
        const emailGameMode: 'PREMIER' | 'GC' = rawGameMode.toUpperCase().includes('GC') ? 'GC' : 'PREMIER'
        const nextMilestone = getNextMilestone(currentRating, emailGameMode)
        const progressPct = nextMilestone
          ? calculateProgressPct(currentRating, 0, nextMilestone)
          : 100
        sendOrderCompletedEmail(
          updatedOrder.user.email,
          updatedOrder.id,
          serviceName,
          {
            currentRating,
            nextMilestone,
            progressPct,
            discountPct: streakResult.newDiscountPct,
            gameMode: emailGameMode,
          }
        ).catch((error) => {
          console.error('[completeOrder] Retention email error:', error)
        })
      }

      // Create retention-aware notifications
      if (updatedOrder.user?.id) {
        prisma.notification.create({
          data: {
            userId: updatedOrder.user.id,
            type: 'ORDER_UPDATE',
            title: `Boost concluído! Você chegou a ${updatedOrder.targetRating ?? updatedOrder.targetRank} pts`,
            message: streakResult.newDiscountPct > 0
              ? `Seus rivais não param. Garanta ${Math.round(streakResult.newDiscountPct * 100)}% off no próximo boost — oferta válida por 48h.`
              : `Continue subindo — contrate o próximo boost e ganhe 5% de desconto.`,
            read: false,
          },
        }).catch((error) => {
          console.error('Failed to create notification for order completed:', error)
        })

        if (streakResult.leveledUp) {
          prisma.notification.create({
            data: {
              userId: updatedOrder.user.id,
              type: 'SYSTEM',
              title: `Fidelidade desbloqueada! ${Math.round(streakResult.newDiscountPct * 100)}% de desconto`,
              message: `Você completou ${streakResult.newStreak} pedidos consecutivos. Seu desconto subiu para ${Math.round(streakResult.newDiscountPct * 100)}%!`,
              read: false,
            },
          }).catch((error) => {
            console.error('Failed to create streak unlock notification:', error)
          })
        }
      }

      return success(updatedOrder as OrderWithRelations)
    } catch (error) {
      console.error('Error completing order:', error)
      return failure('Erro ao concluir pedido', ErrorCodes.DATABASE_ERROR)
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
        return failure(ErrorMessages.ORDER_NOT_FOUND, ErrorCodes.ORDER_NOT_FOUND)
      }

      if (!this.canTransitionStatus(existingOrder.status, status)) {
        return failure(
          `Transição de ${existingOrder.status} para ${status} não permitida`,
          ErrorCodes.INVALID_STATUS_TRANSITION
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
      return failure('Erro ao atualizar status do pedido', ErrorCodes.DATABASE_ERROR)
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
        return failure(ErrorMessages.ORDER_NOT_FOUND, ErrorCodes.ORDER_NOT_FOUND)
      }

      if (order.userId !== userId) {
        return failure(ErrorMessages.ORDER_NOT_BELONGS_TO_USER, ErrorCodes.FORBIDDEN)
      }

      if (!this.canTransitionStatus(order.status, OrderStatus.CANCELLED)) {
        return failure(ErrorMessages.ORDER_NOT_CANCELLABLE, ErrorCodes.ORDER_NOT_CANCELLABLE)
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
      return failure('Erro ao cancelar pedido', ErrorCodes.DATABASE_ERROR)
    }
  },
}
