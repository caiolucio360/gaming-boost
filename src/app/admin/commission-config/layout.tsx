import { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Configuração de Comissões',
  description: 'Configure as porcentagens de comissão para boosters e administradores',
  noindex: true,
})

export default function CommissionConfigLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

