import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Dashboard - GameBoost',
  description: 'Acesse seu dashboard para gerenciar seus pedidos de boost.',
  noindex: true,
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

