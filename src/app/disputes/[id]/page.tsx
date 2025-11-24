'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DisputeChat } from '@/components/disputes/dispute-chat'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DisputePage() {
  const params = useParams()
  const disputeId = parseInt(params.id as string)

  if (isNaN(disputeId)) {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-400">ID de disputa inválido</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          asChild
          variant="ghost"
          className="mb-6 text-purple-400 hover:text-purple-300 font-rajdhani"
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>

        <DisputeChat disputeId={disputeId} />
      </div>
    </div>
  )
}
