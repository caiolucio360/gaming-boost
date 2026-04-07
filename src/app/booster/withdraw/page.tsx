// src/app/booster/withdraw/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { PageHeader } from '@/components/common/page-header'
import { WithdrawContent } from '@/components/common/withdraw-content'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BoosterWithdrawPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'BOOSTER') {
      router.replace(user.role === 'ADMIN' ? '/admin' : '/dashboard')
    }
  }, [user, authLoading, router])

  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'BOOSTER') return null

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="mb-6">
        <Link href="/booster/payments">
          <Button variant="ghost" className="text-brand-purple-light hover:text-brand-purple-light mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Pagamentos
          </Button>
        </Link>
      </div>
      <PageHeader
        highlight="MEUS"
        title="SAQUES"
        description={`Olá, ${user.name || user.email}! Gerencie seus saques e saldo disponível.`}
      />
      <WithdrawContent apiBasePath="/api/booster/withdraw" />
    </div>
  )
}
