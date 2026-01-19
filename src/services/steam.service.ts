/**
 * Steam Service
 * Handles Steam profile validation, CS2 stats fetching, and credential encryption
 */

import { encrypt, decrypt } from '@/lib/encryption'

// Steam profile URL patterns
const STEAM_PROFILE_REGEX = /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/(id|profiles)\/([a-zA-Z0-9_-]+)\/?$/
const STEAM64_ID_REGEX = /^[0-9]{17}$/

interface SteamUrlValidationResult {
    valid: boolean
    type?: 'vanity' | 'steam64'
    identifier?: string
    error?: string
}

interface SteamCredentials {
    username: string
    password: string
}

interface CS2StatsResult {
    success: boolean
    data?: {
        premierRating: number
        rank?: string
        wins?: number
        losses?: number
        kd?: number
    }
    error?: string
}

interface ConsentValidationResult {
    valid: boolean
    error?: string
}

/**
 * Validate Steam profile URL format
 */
export function validateSteamProfileUrl(url: string): SteamUrlValidationResult {
    if (!url || url.trim() === '') {
        return { valid: false, error: 'URL do perfil Steam é obrigatória' }
    }

    const trimmedUrl = url.trim()
    const match = trimmedUrl.match(STEAM_PROFILE_REGEX)

    if (!match) {
        return { valid: false, error: 'URL do Steam inválida. Use o formato: steamcommunity.com/id/username ou steamcommunity.com/profiles/steam64id' }
    }

    const [, urlType, identifier] = match

    if (urlType === 'profiles') {
        // Validate Steam64 ID format (17 digits)
        if (!STEAM64_ID_REGEX.test(identifier)) {
            return { valid: false, error: 'Steam64 ID inválido. Deve ter 17 dígitos' }
        }
        return { valid: true, type: 'steam64', identifier }
    }

    // Vanity URL
    return { valid: true, type: 'vanity', identifier }
}

/**
 * Extract Steam64 ID from profile URL
 * Returns null for vanity URLs (need to resolve via Steam API)
 */
export function extractSteam64Id(url: string): string | null {
    const validation = validateSteamProfileUrl(url)

    if (!validation.valid) {
        return null
    }

    if (validation.type === 'steam64') {
        return validation.identifier || null
    }

    // Vanity URL - need to resolve via Steam API
    return null
}

/**
 * Encrypt Steam credentials for secure storage
 */
export function encryptCredentials(credentials: SteamCredentials): string {
    const json = JSON.stringify(credentials)
    return encrypt(json)
}

/**
 * Decrypt Steam credentials for booster access
 */
export function decryptCredentials(encrypted: string): SteamCredentials {
    const json = decrypt(encrypted)
    const parsed = JSON.parse(json)

    if (!parsed.username || !parsed.password) {
        throw new Error('Credenciais inválidas')
    }

    return {
        username: parsed.username,
        password: parsed.password
    }
}

/**
 * Leetify API Configuration
 * Following Leetify Developer Guidelines: https://leetify.com/blog/leetify-api-developer-guidelines/
 */
export const LEETIFY_API_BASE = 'https://api.leetify.com'
export const LEETIFY_PROFILE_ENDPOINT = '/api/v3/profile'
export const LEETIFY_ATTRIBUTION_LOGO = '/leetify-attribution.png'
export const LEETIFY_HOMEPAGE = 'https://leetify.com'

/**
 * Fetch CS2 stats from Leetify API
 * Uses /v3/profile endpoint as per Leetify documentation
 */
export async function fetchCS2Stats(steam64Id: string): Promise<CS2StatsResult> {
    try {
        const apiKey = process.env.LEETIFY_API_KEY

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        }

        if (apiKey) {
            headers['_leetify_key'] = apiKey
        }

        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        try {
            const response = await fetch(`${LEETIFY_API_BASE}${LEETIFY_PROFILE_ENDPOINT}/${steam64Id}`, {
                method: 'GET',
                headers,
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                if (response.status === 404) {
                    return { success: false, error: 'Jogador não encontrado no Leetify' }
                }
                return { success: false, error: `Erro na API Leetify: ${response.status}` }
            }

            const data = await response.json()

            // Extract Premier rating from Leetify response
            const premierRating = data?.games?.csgo?.skillLevel ||
                data?.games?.csgo?.ranks?.premier?.current ||
                data?.recentGameRankings?.csgo?.skillLevel ||
                null

            if (!premierRating) {
                return { success: false, error: 'Rating Premier não encontrado' }
            }

            return {
                success: true,
                data: {
                    premierRating,
                    rank: data?.games?.csgo?.ranks?.premier?.name,
                    wins: data?.games?.csgo?.wins,
                    losses: data?.games?.csgo?.losses,
                    kd: data?.games?.csgo?.kd
                }
            }
        } finally {
            clearTimeout(timeoutId)
        }
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError' || error.message.includes('timeout')) {
                return { success: false, error: 'timeout - API Leetify não respondeu' }
            }
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Erro desconhecido ao buscar stats' }
    }
}

/**
 * Validate that user has given consent for credential sharing
 */
export function validateConsentGiven(consent: { accepted: boolean; timestamp: string | null }): ConsentValidationResult {
    if (!consent.accepted) {
        return { valid: false, error: 'É necessário aceitar o consentimento para compartilhar credenciais Steam' }
    }

    if (!consent.timestamp) {
        return { valid: false, error: 'Timestamp de consentimento é obrigatório' }
    }

    // Validate timestamp format
    const timestamp = new Date(consent.timestamp)
    if (isNaN(timestamp.getTime())) {
        return { valid: false, error: 'Timestamp de consentimento inválido' }
    }

    return { valid: true }
}

/**
 * Steam Service export object
 */
export const SteamService = {
    validateSteamProfileUrl,
    extractSteam64Id,
    encryptCredentials,
    decryptCredentials,
    fetchCS2Stats,
    validateConsentGiven
}
