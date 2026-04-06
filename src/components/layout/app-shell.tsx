// src/components/layout/app-shell.tsx
'use client'

import { useState, useEffect, Fragment } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Shield,
  SlidersHorizontal,
  CreditCard,
  Percent,
  ExternalLink,
  Briefcase,
  DollarSign,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { NotificationBell } from '@/components/common/notification-bell'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
  external?: boolean
  separator?: boolean
}

const ADMIN_NAV_ITEMS: NavItem[] = [
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

const BOOSTER_NAV_ITEMS: NavItem[] = [
  { label: 'Meus Trabalhos', href: '/booster',          icon: Briefcase, exact: true },
  { label: 'Pagamentos',     href: '/booster/payments', icon: DollarSign },
]

interface AppShellProps {
  role: 'ADMIN' | 'BOOSTER'
  children: React.ReactNode
}

const STORAGE_KEY = 'app-shell-collapsed'

const SEGMENT_LABELS: Record<string, string> = {
  admin:       'Dashboard',
  booster:     'Meus Trabalhos',
  orders:      'Pedidos',
  users:       'Usuários',
  boosters:    'Boosters',
  pricing:     'Precificação',
  payments:    'Pagamentos',
  commissions: 'Comissões',
  profile:     'Meu Perfil',
}

interface Crumb { label: string; href: string }

function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Crumb[] = []
  let accumulated = ''

  for (const seg of segments) {
    accumulated += `/${seg}`
    const isId = /^\d+$/.test(seg)
    const label = isId
      ? `#${seg}`
      : (SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1))
    crumbs.push({ label, href: accumulated })
  }

  return crumbs
}

export function AppShell({ role, children }: AppShellProps) {
  const navItems = role === 'ADMIN' ? ADMIN_NAV_ITEMS : BOOSTER_NAV_ITEMS
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const userInitial = (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase()

  const roleBadgeClass =
    role === 'ADMIN'
      ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30'
      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'

  const roleLabel = role === 'ADMIN' ? 'ADMIN' : 'BOOSTER'
  const roleShort = role === 'ADMIN' ? 'ADM' : 'BST'
  const dashboardHref = role === 'ADMIN' ? '/admin' : '/booster'

  function renderSidebar() {
    return (
      <div className="flex flex-col h-full">
        {/* Header — same h-14 as top bar so logo aligns with bell */}
        <div className={cn(
          'h-14 border-b border-white/10 flex items-center flex-shrink-0',
          collapsed ? 'justify-center relative' : 'px-3'
        )}>
          {/* Logo + badge */}
          <div className={cn('flex items-center gap-2 min-w-0', !collapsed && 'flex-1')}>
            <Link href={dashboardHref} className="flex items-center min-w-0">
              <h1
                className="text-lg font-black font-orbitron leading-none"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {collapsed ? (
                  <span className="text-brand-purple-light">G</span>
                ) : (
                  <>
                    <span className="text-brand-purple-light">GAME</span>
                    <span className="text-white">BOOST</span>
                  </>
                )}
              </h1>
            </Link>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            className={cn(
              'hidden lg:flex w-7 h-7 items-center justify-center text-brand-gray-500 hover:text-brand-purple-light transition-colors flex-shrink-0',
              collapsed && 'absolute right-1.5 top-1/2 -translate-y-1/2'
            )}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

          {/* Nav items */}
          <nav className="scrollbar-none flex-1 overflow-y-auto overflow-x-hidden py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              return (
                <div key={item.href}>
                  {item.separator && (
                    <div className="my-2 mx-3 border-t border-white/10" />
                  )}
                  <Link
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium font-rajdhani border-l-2',
                      active
                        ? 'bg-brand-purple/20 text-brand-purple-light border-brand-purple'
                        : 'text-brand-gray-400 hover:text-brand-purple-light hover:bg-brand-purple/10 border-transparent',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-brand-black-light border border-brand-purple/50 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </div>
              )
            })}
          </nav>

          {/* User footer */}
          <div className="border-t border-white/10 p-3 flex-shrink-0">
            {!collapsed && (
              <div className="flex items-center gap-3 mb-2 px-1">
                <div className="w-8 h-8 rounded-full bg-brand-purple/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-purple-light">{userInitial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm text-white font-medium truncate">{user?.name || 'Usuário'}</p>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded font-rajdhani flex-shrink-0', roleBadgeClass)}>
                      {roleLabel}
                    </span>
                  </div>
                  <p className="text-xs text-brand-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="flex justify-center mb-2">
                <div className="w-8 h-8 rounded-full bg-brand-purple/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-brand-purple-light">{userInitial}</span>
                </div>
              </div>
            )}
          </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-brand-black">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 bg-brand-black-light border-r border-white/10 transition-all duration-300 overflow-hidden',
          collapsed ? 'w-20' : 'w-60'
        )}
      >
        {renderSidebar()}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Fechar menu"
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-default"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') setMobileOpen(false) }}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-60 bg-brand-black-light border-r border-white/10 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderSidebar()}
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar — h-14 matches sidebar header for visual alignment */}
        <header className="h-14 bg-brand-black-light border-b border-white/10 flex items-center gap-3 px-4 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-brand-gray-400 hover:text-brand-purple-light transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Navegação" className="hidden lg:flex items-center gap-1 text-sm ml-1">
            {buildBreadcrumbs(pathname).map((crumb, i, arr) => (
              <Fragment key={crumb.href}>
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-brand-gray-500 flex-shrink-0" />
                )}
                {i < arr.length - 1 ? (
                  <Link
                    href={crumb.href}
                    className="text-brand-gray-400 hover:text-brand-purple-light transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white font-medium">{crumb.label}</span>
                )}
              </Fragment>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Notification bell */}
          <NotificationBell />

          {/* Avatar dropdown — perfil + sair */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-8 h-8 rounded-full bg-brand-purple/30 flex items-center justify-center flex-shrink-0 hover:bg-brand-purple/50 transition-colors"
                aria-label="Menu do usuário"
              >
                <span className="text-sm font-bold text-brand-purple-light">{userInitial}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-brand-black-light border-white/10">
              <DropdownMenuLabel className="pb-1">
                <p className="text-sm text-white font-medium truncate">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-brand-gray-500 font-normal truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => router.push('/profile')}
                className="cursor-pointer text-brand-gray-300 hover:text-white focus:text-white"
              >
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-brand-black">
          {children}
        </main>
      </div>
    </div>
  )
}
