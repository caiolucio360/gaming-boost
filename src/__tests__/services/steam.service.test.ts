/**
 * Tests para Steam Service
 * TDD: Testes escritos primeiro, focando em validação e integração com Leetify API
 */

import {
    validateSteamProfileUrl,
    extractSteam64Id,
    encryptCredentials,
    decryptCredentials,
    fetchCS2Stats,
    validateConsentGiven
} from '@/services/steam.service'

describe('SteamService - Validação de URL', () => {
    describe('validateSteamProfileUrl', () => {
        it('deve aceitar URL válida do formato steamcommunity.com/id/username', () => {
            const url = 'https://steamcommunity.com/id/gaborocks'
            const result = validateSteamProfileUrl(url)

            expect(result.valid).toBe(true)
            expect(result.type).toBe('vanity')
            expect(result.identifier).toBe('gaborocks')
        })

        it('deve aceitar URL válida do formato steamcommunity.com/profiles/steam64id', () => {
            const url = 'https://steamcommunity.com/profiles/76561198012345678'
            const result = validateSteamProfileUrl(url)

            expect(result.valid).toBe(true)
            expect(result.type).toBe('steam64')
            expect(result.identifier).toBe('76561198012345678')
        })

        it('deve aceitar URL sem https://', () => {
            const url = 'steamcommunity.com/id/gaborocks'
            const result = validateSteamProfileUrl(url)

            expect(result.valid).toBe(true)
        })

        it('deve aceitar URL com www', () => {
            const url = 'https://www.steamcommunity.com/id/gaborocks'
            const result = validateSteamProfileUrl(url)

            expect(result.valid).toBe(true)
        })

        it('deve rejeitar URL inválida', () => {
            const url = 'https://google.com/id/test'
            const result = validateSteamProfileUrl(url)

            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
        })

        it('deve rejeitar URL vazia', () => {
            const url = ''
            const result = validateSteamProfileUrl(url)

            expect(result.valid).toBe(false)
        })

        it('deve rejeitar URL malformada', () => {
            const url = 'not-a-valid-url'
            const result = validateSteamProfileUrl(url)

            expect(result.valid).toBe(false)
        })
    })

    describe('extractSteam64Id', () => {
        it('deve extrair Steam64 ID de URL profiles/', () => {
            const url = 'https://steamcommunity.com/profiles/76561198012345678'
            const steam64 = extractSteam64Id(url)

            expect(steam64).toBe('76561198012345678')
        })

        it('deve retornar null para URL vanity (precisa resolver via API)', () => {
            const url = 'https://steamcommunity.com/id/gaborocks'
            const steam64 = extractSteam64Id(url)

            expect(steam64).toBeNull()
        })
    })
})

describe('SteamService - Criptografia de Credenciais', () => {
    describe('encryptCredentials', () => {
        it('deve criptografar username e password', () => {
            const credentials = {
                username: 'mysteamuser',
                password: 'mypassword123'
            }

            const encrypted = encryptCredentials(credentials)

            expect(encrypted).toBeDefined()
            expect(encrypted).not.toContain('mysteamuser')
            expect(encrypted).not.toContain('mypassword123')
        })

        it('deve gerar outputs diferentes para mesma entrada (IV aleatório)', () => {
            const credentials = {
                username: 'mysteamuser',
                password: 'mypassword123'
            }

            const encrypted1 = encryptCredentials(credentials)
            const encrypted2 = encryptCredentials(credentials)

            expect(encrypted1).not.toBe(encrypted2)
        })
    })

    describe('decryptCredentials', () => {
        it('deve descriptografar credenciais corretamente', () => {
            const original = {
                username: 'mysteamuser',
                password: 'mypassword123'
            }

            const encrypted = encryptCredentials(original)
            const decrypted = decryptCredentials(encrypted)

            expect(decrypted.username).toBe(original.username)
            expect(decrypted.password).toBe(original.password)
        })

        it('deve lançar erro para dados corrompidos', () => {
            const corruptedData = 'invalid-encrypted-data'

            expect(() => decryptCredentials(corruptedData)).toThrow()
        })
    })
})

describe('SteamService - Integração Leetify API', () => {
    const originalFetch = global.fetch

    afterEach(() => {
        global.fetch = originalFetch
    })

    describe('fetchCS2Stats', () => {
        it('deve retornar stats do jogador quando encontrado', async () => {
            // Mock do fetch para simular resposta da API
            const mockResponse = {
                meta: { steamId: '76561198012345678' },
                games: {
                    csgo: {
                        skillLevel: 18500,
                        ranks: {
                            premier: { current: 18500 }
                        }
                    }
                }
            }

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            }) as jest.Mock

            const stats = await fetchCS2Stats('76561198012345678')

            expect(stats.success).toBe(true)
            expect(stats.data?.premierRating).toBe(18500)
        })

        it('deve retornar erro quando jogador não encontrado', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404
            }) as jest.Mock

            const stats = await fetchCS2Stats('invalid-steam-id')

            expect(stats.success).toBe(false)
            expect(stats.error).toBeDefined()
        })

        it('deve tratar timeout da API', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('timeout')) as jest.Mock

            const stats = await fetchCS2Stats('76561198012345678')

            expect(stats.success).toBe(false)
            expect(stats.error).toContain('timeout')
        })
    })
})

describe('SteamService - Consentimento', () => {
    describe('validateConsentGiven', () => {
        it('deve aceitar consentimento válido', () => {
            const consent = {
                accepted: true,
                timestamp: new Date().toISOString()
            }

            const result = validateConsentGiven(consent)

            expect(result.valid).toBe(true)
        })

        it('deve rejeitar consentimento não aceito', () => {
            const consent = {
                accepted: false,
                timestamp: new Date().toISOString()
            }

            const result = validateConsentGiven(consent)

            expect(result.valid).toBe(false)
            expect(result.error).toContain('consentimento')
        })

        it('deve rejeitar consentimento sem timestamp', () => {
            const consent = {
                accepted: true,
                timestamp: null
            }

            const result = validateConsentGiven(consent)

            expect(result.valid).toBe(false)
        })
    })
})
