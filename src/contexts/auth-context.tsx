'use client'

import React, { createContext, useContext } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { User } from '@/types'

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
      }
    : null

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      throw new Error(result.error)
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

    // Após criar conta, fazer login automaticamente
    await login(email, password)
    
    // Registro sempre cria como CLIENT, então redireciona para dashboard
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
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
