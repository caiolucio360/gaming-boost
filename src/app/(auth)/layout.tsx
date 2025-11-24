import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Autenticação - GameBoost',
  description: 'Faça login ou crie sua conta na GameBoost para acessar nossos serviços de boost profissional.',
  noindex: true,
})

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

