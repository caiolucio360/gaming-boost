/**
 * Chat Zod schemas for order chat message validation
 * Used for the secure chat between client and booster
 */

import { z } from 'zod'

/**
 * Maximum message length for chat messages
 */
const MAX_MESSAGE_LENGTH = 2000

/**
 * Schema for sending a regular text chat message
 */
export const SendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(MAX_MESSAGE_LENGTH, `Mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres`)
    .trim(),
})

/**
 * Schema for sending Steam credentials via chat
 */
export const SendCredentialsSchema = z.object({
  messageType: z.literal('STEAM_CREDENTIALS'),
  credentials: z.object({
    username: z.string().min(1, 'Usuário Steam é obrigatório').max(100),
    password: z.string().min(1, 'Senha Steam é obrigatória').max(200),
  }),
})

/**
 * Schema for chat message query parameters
 */
export const ChatQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.coerce.number().int().positive().optional(),
})

// Type exports
export type SendMessageInput = z.infer<typeof SendMessageSchema>
export type SendCredentialsInput = z.infer<typeof SendCredentialsSchema>
export type ChatQueryInput = z.infer<typeof ChatQuerySchema>
