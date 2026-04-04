// src/app/admin/layout.tsx
import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Shield,
  SlidersHorizontal,
  CreditCard,
  Percent,
  ExternalLink,
} from 'lucide-react'
import { AppShell, type NavItem } from '@/components/layout/app-shell'

export const metadata: Metadata = generateMetadata({
  title: 'Painel Administrativo - GameBoost',
  description: 'Painel administrativo da GameBoost.',
  noindex: true,
})

const adminNavItems: NavItem[] = [
  { label: 'Dashboard',    href: '/admin',             icon: LayoutDashboard, exact: true },
  { label: 'Pedidos',      href: '/admin/orders',      icon: ShoppingCart },
  { label: 'Usuários',     href: '/admin/users',       icon: Users },
  { label: 'Boosters',     href: '/admin/boosters',    icon: Shield },
  { label: 'Precificação', href: '/admin/pricing',     icon: SlidersHorizontal },
  { label: 'Pagamentos',   href: '/admin/payments',    icon: CreditCard },
  { label: 'Comissões',    href: '/admin/commissions', icon: Percent },
  {
    separator: true,
    label: 'Preview do Site',
    href: '/games/cs2',
    icon: ExternalLink,
    external: true,
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="ADMIN" navItems={adminNavItems}>
      {children}
    </AppShell>
  )
}
