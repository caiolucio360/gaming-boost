import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Painel Administrativo - GameBoost Pro',
  description: 'Painel administrativo da GameBoost Pro.',
  noindex: true,
})

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

