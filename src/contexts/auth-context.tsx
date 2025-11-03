'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from '@/types'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  onLoginSuccess?: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [onLoginSuccess, setOnLoginSuccess] = useState<(() => Promise<void>) | undefined>()

  // Verificar sessão ao carregar
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao fazer login')
    }

    const data = await response.json()
    setUser(data.user)
    
    // Processar carrinho após login bem-sucedido se a função estiver definida
    if (onLoginSuccess) {
      try {
        await onLoginSuccess()
      } catch (error) {
        console.error('Erro ao processar após login:', error)
      }
    }
    
    // Redirecionar baseado no role usando replace para não adicionar ao histórico
    if (data.user.role === 'ADMIN') {
      router.replace('/admin')
    } else if (data.user.role === 'BOOSTER') {
      router.replace('/booster')
    } else {
      router.replace('/dashboard')
    }
  }, [router, onLoginSuccess])

  const register = useCallback(async (name: string, email: string, password: string) => {
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

    const data = await response.json()
    setUser(data.user)
    
    // Processar carrinho após registro bem-sucedido se a função estiver definida
    if (onLoginSuccess) {
      try {
        await onLoginSuccess()
      } catch (error) {
        console.error('Erro ao processar após registro:', error)
      }
    }
    
    // Registro sempre cria como CLIENT, então redireciona para dashboard
    // Usar replace para não adicionar ao histórico
    router.replace('/dashboard')
  }, [router, onLoginSuccess])

  const logout = useCallback(async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    })

    if (response.ok) {
      setUser(null)
      // Usar replace para não adicionar ao histórico
      router.replace('/login')
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    await checkSession()
  }, [checkSession])

  // Expor função para configurar o callback de login via window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__setAuthLoginCallback = (callback: () => Promise<void>) => {
        setOnLoginSuccess(() => callback)
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        onLoginSuccess,
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
