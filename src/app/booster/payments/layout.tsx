import { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Meus Pagamentos',
  description: 'Visualize suas comissões e ganhos como booster',
  noindex: true,
})

export default function BoosterPaymentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

