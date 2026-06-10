// src/app/admin/withdraw/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { AdminPageShell } from '@/components/common/admin-page-shell'
import { WithdrawContent } from '@/components/common/withdraw-content'

export default function AdminWithdrawPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'ADMIN') {
      router.replace(user.role === 'BOOSTER' ? '/booster' : '/dashboard')
    }
  }, [user, authLoading, router])

  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'ADMIN') return null

  return (
    <AdminPageShell
      highlight="ADMIN"
      title="SAQUES"
      description={`Olá, ${user.name || user.email}! Gerencie seus saques e saldo disponível.`}
      backHref="/admin/payments"
      backLabel="Voltar para Pagamentos"
    >
      <WithdrawContent apiBasePath="/api/admin/withdraw" />
    </AdminPageShell>
  )
}
