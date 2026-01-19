
// Mock process.env
const originalEnv = process.env

describe('Security Hardening Verification', () => {
    beforeEach(() => {
        jest.resetModules()
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    describe('JWT Secret', () => {
        it('should throw error if JWT_SECRET is missing', async () => {
            delete process.env.JWT_SECRET

            // Re-import to trigger top-level check
            await expect(import('@/lib/jwt')).rejects.toThrow('FATAL: JWT_SECRET environment variable is not defined')
        })

        it('should work when JWT_SECRET is present', async () => {
            process.env.JWT_SECRET = 'valid-secret-for-testing'
            const { generateToken } = await import('@/lib/jwt')
            const token = generateToken({ userId: 1, email: 'test@test.com', role: 'CLIENT' })
            expect(token).toBeDefined()
            expect(typeof token).toBe('string')
        })
    })

    describe('Encryption Key', () => {
        it('should throw error if ENCRYPTION_KEY is missing', async () => {
            delete process.env.ENCRYPTION_KEY

            const { encrypt } = await import('@/lib/encryption')
            expect(() => encrypt('test')).toThrow('FATAL: ENCRYPTION_KEY environment variable is not defined')
        })

        it('should throw error if ENCRYPTION_KEY is invalid length', async () => {
            process.env.ENCRYPTION_KEY = 'short-key'
            const { encrypt } = await import('@/lib/encryption')
            expect(() => encrypt('test')).toThrow('FATAL: ENCRYPTION_KEY must be exactly 64 hex characters')
        })

        it('should work with valid key', async () => {
            // 32 bytes = 64 hex chars
            process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
            const { encrypt, decrypt } = await import('@/lib/encryption')
            const encrypted = encrypt('secret data')
            expect(encrypted).not.toBe('secret data')
            const decrypted = decrypt(encrypted)
            expect(decrypted).toBe('secret data')
        })
    })
})
