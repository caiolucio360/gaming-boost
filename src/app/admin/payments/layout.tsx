import { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Minhas Receitas',
  description: 'Visualize suas receitas e pagamentos como administrador',
  noindex: true,
})

export default function AdminPaymentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

