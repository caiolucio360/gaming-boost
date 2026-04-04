// src/app/booster/layout.tsx
import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'
import { Briefcase, DollarSign, User } from 'lucide-react'
import { AppShell, type NavItem } from '@/components/layout/app-shell'

export const metadata: Metadata = generateMetadata({
  title: 'Painel do Booster - GameBoost',
  description: 'Painel de controle para boosters da GameBoost.',
  noindex: true,
})

const boosterNavItems: NavItem[] = [
  { label: 'Meus Trabalhos', href: '/booster',          icon: Briefcase, exact: true },
  { label: 'Pagamentos',     href: '/booster/payments', icon: DollarSign },
  { label: 'Meu Perfil',     href: '/profile',          icon: User },
]

export default function BoosterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="BOOSTER" navItems={boosterNavItems}>
      {children}
    </AppShell>
  )
}
