'use client'

import React, { createContext, useContext } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { User } from '@/types'
import { ErrorCodes, ErrorMessages } from '@/lib/error-constants'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()

  const loading = status === 'loading'
  const user: User | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined,
        role: session.user.role,
        isDevAdmin: session.user.isDevAdmin,
      }
    : null

  const login = async (email: string, password: string) => {
    // Pré-validar credenciais via API para obter códigos de erro estruturados
    const preValidation = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!preValidation.ok) {
      const errorData = await preValidation.json()

      if (errorData.code === ErrorCodes.USER_NOT_VERIFIED) {
        // Enviar novo código de verificação e redirecionar para ativação
        fetch('/api/auth/resend-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(() => {})
        window.location.href = `/verify?email=${encodeURIComponent(email)}`
        return
      }

      throw new Error(errorData.message || ErrorMessages.AUTH_CREDENTIALS_INVALID)
    }

    // Credenciais válidas e conta ativa — criar sessão via NextAuth
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      throw new Error(ErrorMessages.AUTH_SESSION_ERROR)
    }

    // Atualizar sessão após login
    await update()

    // Aguardar um pouco para a sessão ser atualizada
    await new Promise(resolve => setTimeout(resolve, 100))

    // Redirecionar baseado no role
    if (typeof window !== 'undefined') {
      const currentSession = await update()
      const userRole = currentSession?.user?.role || session?.user?.role

      if (userRole === 'ADMIN') {
        window.location.href = '/admin'
      } else if (userRole === 'BOOSTER') {
        window.location.href = '/booster'
      } else {
        // Para clientes, verificar se há itens no carrinho para processar
        // O callback processCartAfterLogin será chamado pelo CartAuthIntegration
        const processCart = (window as any).__processCartAfterLogin
        if (processCart) {
          try {
            const cartResult = await processCart()
            if (cartResult?.success && cartResult?.orderId) {
              // Redirecionar para pagamento com o ID do pedido
              window.location.href = `/payment?orderId=${cartResult.orderId}&total=${cartResult.total}`
              return
            }
            if (cartResult && !cartResult.success && cartResult.error) {
              console.warn('[Cart] Order creation failed after login:', cartResult.error)
            }
          } catch (error) {
            console.error('Erro ao processar carrinho:', error)
          }
        }
        // Se não há carrinho ou erro, ir para dashboard
        window.location.href = '/dashboard'
      }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    // Criar conta via API
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao criar conta')
    }

    // Registro agora redireciona para verificação, não faz login automático imediato
    if (typeof window !== 'undefined') {
      window.location.href = `/verify?email=${encodeURIComponent(email)}`
    }
  }

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' })
  }

  const refreshUser = async () => {
    await update()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
