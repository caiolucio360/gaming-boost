import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Carrinho - GameBoost',
  description: 'Seu carrinho de compras da GameBoost.',
  noindex: true,
})

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

