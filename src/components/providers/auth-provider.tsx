'use client'

import { AuthProvider } from '@/contexts/auth-context'
import { CartProvider } from '@/contexts/cart-context'
import { CartAuthIntegration } from './cart-auth-integration'

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <AuthProvider>
        <CartAuthIntegration />
        {children}
      </AuthProvider>
    </CartProvider>
  )
}

