'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/contexts/auth-context'
import { CartProvider } from '@/contexts/cart-context'
import { CartAuthIntegration } from './cart-auth-integration'

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <AuthProvider>
          <CartAuthIntegration />
          {children}
        </AuthProvider>
      </CartProvider>
    </SessionProvider>
  )
}

