/**
 * Encryption Utility
 * AES-256-GCM encryption for sensitive data like Steam credentials
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

/**
 * Get or generate encryption key from environment
 * In production, this should be a secure, persistent key
 */
function getEncryptionKey(): Buffer {
    const keyEnv = process.env.ENCRYPTION_KEY

    if (keyEnv) {
        // Key should be 32 bytes (256 bits) hex encoded = 64 chars
        if (keyEnv.length === 64) {
            return Buffer.from(keyEnv, 'hex')
        }
        // If not hex, hash it to get consistent key
        return crypto.createHash('sha256').update(keyEnv).digest()
    }

    // Fallback for development - NOT secure for production
    console.warn('⚠️ ENCRYPTION_KEY not set, using insecure default')
    return crypto.createHash('sha256').update('dev-key-not-for-production').digest()
}

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns base64 encoded: IV + AuthTag + Ciphertext
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8')
    encrypted = Buffer.concat([encrypted, cipher.final()])

    const authTag = cipher.getAuthTag()

    // Combine IV + AuthTag + Ciphertext
    const combined = Buffer.concat([iv, authTag, encrypted])

    return combined.toString('base64')
}

/**
 * Decrypt ciphertext encrypted with AES-256-GCM
 * Expects base64 encoded: IV + AuthTag + Ciphertext
 */
export function decrypt(ciphertext: string): string {
    const key = getEncryptionKey()

    const combined = Buffer.from(ciphertext, 'base64')

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
        throw new Error('Dados criptografados inválidos')
    }

    // Extract IV, AuthTag, and Ciphertext
    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf8')
}
