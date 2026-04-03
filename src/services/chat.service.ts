/**
 * Chat Service
 * Manages secure encrypted chat between client and booster for an order
 *
 * Uses Result<T> pattern for consistent error handling
 */

import { prisma } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/encryption'
import { OrderStatus } from '@/generated/prisma/client'
import { Result, success, failure } from './types'

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  id: number
  content: string
  messageType: 'TEXT' | 'STEAM_CREDENTIALS'
  isExpired: boolean
  authorId: number
  author: {
    id: number
    name: string | null
    image: string | null
    role: string
  }
  createdAt: Date
}

interface ChatWithMessages {
  id: number
  orderId: number
  isActive: boolean
  messages: ChatMessage[]
  order: {
    id: number
    status: OrderStatus
    userId: number
    boosterId: number | null
  }
}

interface SendMessageInput {
  orderId: number
  authorId: number
  content?: string
  messageType?: 'TEXT' | 'STEAM_CREDENTIALS'
  credentials?: { username: string; password: string }
}

interface GetMessagesInput {
  orderId: number
  userId: number
  limit?: number
  before?: number
}

// ============================================================================
// ChatService
// ============================================================================

export const ChatService = {
  // --------------------------------------------------------------------------
  // Access Control
  // --------------------------------------------------------------------------

  /**
   * Check if user has access to the order's chat
   * Only client (order owner), assigned booster, and ADMIN can access
   */
  async validateAccess(
    orderId: number,
    userId: number
  ): Promise<Result<{ hasAccess: boolean; role: 'client' | 'booster' | 'admin' }>> {
    try {
      // Get user role and order info
      const [user, order] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        }),
        prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true, userId: true, boosterId: true, status: true },
        }),
      ])

      if (!user) {
        return failure('Usuário não encontrado', 'USER_NOT_FOUND')
      }

      if (!order) {
        return failure('Pedido não encontrado', 'ORDER_NOT_FOUND')
      }

      // ADMIN always has access
      if (user.role === 'ADMIN') {
        return success({ hasAccess: true, role: 'admin' })
      }

      // Order owner (client) has access
      if (order.userId === userId) {
        return success({ hasAccess: true, role: 'client' })
      }

      // Assigned booster has access
      if (order.boosterId === userId) {
        return success({ hasAccess: true, role: 'booster' })
      }

      return success({ hasAccess: false, role: 'client' })
    } catch (error) {
      console.error('Error validating chat access:', error)
      return failure('Erro ao validar acesso ao chat', 'DATABASE_ERROR')
    }
  },

  /**
   * Check if chat is active for the order (only IN_PROGRESS orders can chat)
   */
  async isChatEnabled(orderId: number): Promise<Result<{ enabled: boolean; reason?: string }>> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, boosterId: true },
      })

      if (!order) {
        return failure('Pedido não encontrado', 'ORDER_NOT_FOUND')
      }

      // Chat is only enabled for IN_PROGRESS orders
      if (order.status === OrderStatus.IN_PROGRESS) {
        return success({ enabled: true })
      }

      // Chat can be read but not written for COMPLETED orders
      if (order.status === OrderStatus.COMPLETED) {
        return success({ enabled: false, reason: 'Pedido concluído. O chat está desabilitado.' })
      }

      // Not available for other statuses
      return success({
        enabled: false,
        reason: 'Chat disponível apenas para pedidos em andamento.'
      })
    } catch (error) {
      console.error('Error checking chat status:', error)
      return failure('Erro ao verificar status do chat', 'DATABASE_ERROR')
    }
  },

  // --------------------------------------------------------------------------
  // Chat Operations
  // --------------------------------------------------------------------------

  /**
   * Get or create chat for an order
   */
  async getOrCreateChat(orderId: number): Promise<Result<{ chatId: number; isNew: boolean }>> {
    try {
      // Check if chat exists
      const existingChat = await prisma.orderChat.findUnique({
        where: { orderId },
        select: { id: true },
      })

      if (existingChat) {
        return success({ chatId: existingChat.id, isNew: false })
      }

      // Create new chat
      const newChat = await prisma.orderChat.create({
        data: {
          orderId,
          isActive: true,
        },
        select: { id: true },
      })

      return success({ chatId: newChat.id, isNew: true })
    } catch (error) {
      console.error('Error getting or creating chat:', error)
      return failure('Erro ao criar chat', 'DATABASE_ERROR')
    }
  },

  /**
   * Send a message to the order chat
   * Message content is encrypted before storage
   */
  async sendMessage(input: SendMessageInput): Promise<Result<ChatMessage>> {
    const { orderId, authorId, messageType = 'TEXT', credentials } = input
    const content = input.content

    try {
      // Validate access
      const accessResult = await this.validateAccess(orderId, authorId)
      if (!accessResult.success) {
        return accessResult
      }
      if (!accessResult.data.hasAccess) {
        return failure('Você não tem acesso a este chat', 'CHAT_ACCESS_DENIED')
      }

      // Check if chat is enabled
      const enabledResult = await this.isChatEnabled(orderId)
      if (!enabledResult.success) {
        return enabledResult
      }
      if (!enabledResult.data.enabled) {
        return failure(enabledResult.data.reason || 'Chat desabilitado', 'CHAT_DISABLED')
      }

      // STEAM_CREDENTIALS: only the client (order owner) can send
      if (messageType === 'STEAM_CREDENTIALS') {
        if (accessResult.data.role !== 'client') {
          return failure('Apenas o cliente pode enviar credenciais Steam', 'CHAT_ACCESS_DENIED')
        }
        if (!credentials?.username || !credentials?.password) {
          return failure('Usuário e senha são obrigatórios', 'VALIDATION_ERROR')
        }
      } else {
        // TEXT: content is required
        if (!content || content.trim().length === 0) {
          return failure('Mensagem não pode estar vazia', 'VALIDATION_ERROR')
        }
      }

      // Get or create chat
      const chatResult = await this.getOrCreateChat(orderId)
      if (!chatResult.success) {
        return chatResult
      }

      let encryptedContent: string
      let plainContent: string

      if (messageType === 'STEAM_CREDENTIALS') {
        // Expire any existing active credential messages for this order
        await prisma.orderMessage.updateMany({
          where: {
            chat: { orderId },
            messageType: 'STEAM_CREDENTIALS',
            isExpired: false,
          },
          data: {
            content: '[Credenciais substituídas]',
            isEncrypted: false,
            isExpired: true,
          },
        })

        // Encrypt credentials as JSON (never log the plaintext)
        plainContent = JSON.stringify({ username: credentials!.username, password: credentials!.password })
        try {
          encryptedContent = encrypt(plainContent)
        } catch (error) {
          console.error('Error encrypting credentials')
          return failure('Erro ao criptografar credenciais', 'ENCRYPTION_ERROR')
        }
      } else {
        plainContent = content!
        try {
          encryptedContent = encrypt(plainContent)
        } catch (error) {
          console.error('Error encrypting message:', error)
          return failure('Erro ao criptografar mensagem', 'ENCRYPTION_ERROR')
        }
      }

      // Create message
      const message = await prisma.orderMessage.create({
        data: {
          chatId: chatResult.data.chatId,
          authorId,
          content: encryptedContent,
          isEncrypted: true,
          messageType,
        },
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
        },
      })

      // Get order info for notification
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true, boosterId: true },
      })

      // Create notification for the other party (skip for credential messages to avoid leaking info)
      if (order && messageType === 'TEXT') {
        const recipientId = authorId === order.userId ? order.boosterId : order.userId
        if (recipientId) {
          prisma.notification.create({
            data: {
              userId: recipientId,
              type: 'CHAT',
              title: 'Nova mensagem',
              message: `Você recebeu uma nova mensagem no pedido #${orderId}`,
              metadata: JSON.stringify({ orderId }),
            },
          }).catch((error) => {
            console.error('Failed to create chat notification:', error)
          })
        }
      }

      return success({
        id: message.id,
        content: plainContent, // Return original content (decrypted)
        messageType,
        isExpired: false,
        authorId: message.authorId,
        author: {
          id: message.author.id,
          name: message.author.name,
          image: message.author.image,
          role: message.author.role,
        },
        createdAt: message.createdAt,
      })
    } catch (error) {
      console.error('Error sending message:', error)
      return failure('Erro ao enviar mensagem', 'DATABASE_ERROR')
    }
  },

  /**
   * Get messages for an order chat
   * Messages are decrypted before being returned
   */
  async getMessages(input: GetMessagesInput): Promise<Result<ChatWithMessages | null>> {
    const { orderId, userId, limit = 50, before } = input

    try {
      // Validate access
      const accessResult = await this.validateAccess(orderId, userId)
      if (!accessResult.success) {
        return accessResult
      }
      if (!accessResult.data.hasAccess) {
        return failure('Você não tem acesso a este chat', 'CHAT_ACCESS_DENIED')
      }

      // Get chat with messages
      const chat = await prisma.orderChat.findUnique({
        where: { orderId },
        include: {
          messages: {
            where: before ? { id: { lt: before } } : undefined,
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, name: true, image: true, role: true },
              },
            },
          },
          order: {
            select: { id: true, status: true, userId: true, boosterId: true },
          },
        },
      })

      if (!chat) {
        // Return null if no chat exists (chat is created when first message is sent)
        return success(null)
      }

      // Determine requester role for access control on STEAM_CREDENTIALS
      const requesterRole = accessResult.data.role

      // Decrypt messages
      const decryptedMessages: ChatMessage[] = []
      for (const message of chat.messages) {
        const msgType = (message.messageType as 'TEXT' | 'STEAM_CREDENTIALS') || 'TEXT'
        const isExpired = message.isExpired ?? false

        // STEAM_CREDENTIALS: admin never sees the content
        if (msgType === 'STEAM_CREDENTIALS' && requesterRole === 'admin') {
          decryptedMessages.push({
            id: message.id,
            content: '[Credenciais Steam - acesso restrito]',
            messageType: msgType,
            isExpired,
            authorId: message.authorId,
            author: {
              id: message.author.id,
              name: message.author.name,
              image: message.author.image,
              role: message.author.role,
            },
            createdAt: message.createdAt,
          })
          continue
        }

        // Expired credentials: content is already plain placeholder (isEncrypted=false)
        let content = message.content
        if (message.isEncrypted) {
          try {
            content = decrypt(message.content)
          } catch (error) {
            console.error('Error decrypting message:', error)
            content = '[Erro ao descriptografar mensagem]'
          }
        }

        decryptedMessages.push({
          id: message.id,
          content,
          messageType: msgType,
          isExpired,
          authorId: message.authorId,
          author: {
            id: message.author.id,
            name: message.author.name,
            image: message.author.image,
            role: message.author.role,
          },
          createdAt: message.createdAt,
        })
      }

      return success({
        id: chat.id,
        orderId: chat.orderId,
        isActive: chat.isActive,
        messages: decryptedMessages,
        order: {
          id: chat.order.id,
          status: chat.order.status,
          userId: chat.order.userId,
          boosterId: chat.order.boosterId,
        },
      })
    } catch (error) {
      console.error('Error getting messages:', error)
      return failure('Erro ao buscar mensagens', 'DATABASE_ERROR')
    }
  },

  /**
   * Disable chat for an order (called when order is completed or cancelled)
   */
  async disableChat(orderId: number): Promise<Result<void>> {
    try {
      await prisma.orderChat.updateMany({
        where: { orderId },
        data: { isActive: false },
      })

      return success(undefined)
    } catch (error) {
      console.error('Error disabling chat:', error)
      return failure('Erro ao desabilitar chat', 'DATABASE_ERROR')
    }
  },

  /**
   * Wipe Steam credentials from chat when order closes (COMPLETED or CANCELLED)
   * Replaces encrypted content with a plain placeholder and marks as expired
   */
  async wipeSteamCredentials(orderId: number): Promise<Result<void>> {
    try {
      const chat = await prisma.orderChat.findUnique({
        where: { orderId },
        select: { id: true },
      })

      if (!chat) {
        return success(undefined) // No chat, nothing to wipe
      }

      await prisma.orderMessage.updateMany({
        where: {
          chatId: chat.id,
          messageType: 'STEAM_CREDENTIALS',
          isExpired: false,
        },
        data: {
          content: '[Credenciais removidas após conclusão do pedido]',
          isEncrypted: false,
          isExpired: true,
        },
      })

      return success(undefined)
    } catch (error) {
      console.error('Error wiping Steam credentials:', error)
      return failure('Erro ao remover credenciais', 'DATABASE_ERROR')
    }
  },
}
