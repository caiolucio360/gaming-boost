import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Carrinho - GameBoost Pro',
  description: 'Seu carrinho de compras da GameBoost Pro.',
  noindex: true,
})

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

