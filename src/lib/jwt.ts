import jwt from 'jsonwebtoken'

// Interface para o payload do JWT
export interface JWTPayload {
  userId: number
  email: string
  role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
}

// Obter a secret key do ambiente ou usar uma padrão para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d' // 7 dias por padrão

/**
 * Gera um token JWT para o usuário
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'gaming-boost',
      audience: 'gaming-boost-users',
    } as jwt.SignOptions
  )
}

/**
 * Verifica e decodifica um token JWT
 * Retorna o payload se válido, ou null se inválido
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'gaming-boost',
      audience: 'gaming-boost-users',
    }) as JWTPayload

    return decoded
  } catch (error) {
    // Token inválido, expirado ou malformado
    return null
  }
}

/**
 * Decodifica um token JWT sem verificar a assinatura
 * Útil apenas para debug ou quando você já verificou o token
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Extrai o token do header Authorization
 * Formato esperado: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

