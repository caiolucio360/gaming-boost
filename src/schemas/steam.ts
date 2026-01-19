/**
 * Steam Zod Schemas
 * Validation schemas for Steam profile and credentials
 */

import { z } from 'zod'

/**
 * Steam profile URL validation
 */
export const SteamProfileUrlSchema = z
    .string()
    .min(1, 'URL do perfil Steam é obrigatória')
    .refine(
        (url) => {
            const regex = /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+\/?$/
            return regex.test(url)
        },
        { message: 'URL do Steam inválida. Use steamcommunity.com/id/username ou steamcommunity.com/profiles/steam64id' }
    )

/**
 * Steam64 ID validation (17 digits)
 */
export const Steam64IdSchema = z
    .string()
    .regex(/^[0-9]{17}$/, 'Steam64 ID deve ter 17 dígitos')

/**
 * Steam credentials schema (for order)
 */
export const SteamCredentialsSchema = z.object({
    username: z
        .string()
        .min(3, 'Username Steam deve ter pelo menos 3 caracteres')
        .max(100, 'Username Steam muito longo'),
    password: z
        .string()
        .min(6, 'Senha deve ter pelo menos 6 caracteres')
        .max(100, 'Senha muito longa'),
})

/**
 * Steam consent schema (for order creation)
 */
export const SteamConsentSchema = z.object({
    accepted: z.boolean().refine((val) => val === true, {
        message: 'É necessário aceitar o consentimento para compartilhar credenciais Steam',
    }),
    timestamp: z.string().datetime({ message: 'Timestamp inválido' }),
})

/**
 * CS2 Stats schema (for booster profile)
 */
export const CS2StatsSchema = z.object({
    premierRating: z.number().int().min(0).max(50000).optional(),
    rank: z.string().max(50).optional(),
    hours: z.number().int().min(0).optional(),
})

/**
 * Booster Steam profile schema (for booster application)
 */
export const BoosterSteamProfileSchema = z.object({
    steamProfileUrl: SteamProfileUrlSchema,
    cs2PremierRating: z.number().int().min(0).max(50000).optional(),
    cs2Rank: z.string().max(50).optional(),
    cs2Hours: z.number().int().min(0).optional(),
})

/**
 * Client Steam credentials schema (for order)
 */
export const ClientSteamCredentialsSchema = z.object({
    steamProfileUrl: SteamProfileUrlSchema,
    credentials: SteamCredentialsSchema,
    consent: SteamConsentSchema,
})

/**
 * Inferred types
 */
export type SteamCredentials = z.infer<typeof SteamCredentialsSchema>
export type SteamConsent = z.infer<typeof SteamConsentSchema>
export type CS2Stats = z.infer<typeof CS2StatsSchema>
export type BoosterSteamProfile = z.infer<typeof BoosterSteamProfileSchema>
export type ClientSteamCredentials = z.infer<typeof ClientSteamCredentialsSchema>
