import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Pagamento - FlautasBoost',
  description: 'Finalize seu pagamento para o serviço de boost.',
  noindex: true,
})

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

