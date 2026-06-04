import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Carrinho - FlautasBoost',
  description: 'Seu carrinho de compras da FlautasBoost.',
  noindex: true,
})

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

