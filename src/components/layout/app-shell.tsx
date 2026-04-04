// src/components/layout/app-shell.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Menu, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { NotificationBell } from '@/components/common/notification-bell'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
  external?: boolean
  separator?: boolean
}

interface AppShellProps {
  role: 'ADMIN' | 'BOOSTER'
  navItems: NavItem[]
  children: React.ReactNode
}

const STORAGE_KEY = 'app-shell-collapsed'

export function AppShell({ role, navItems, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Restore collapse state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  // Close mobile drawer on route change
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
  const dashboardHref = role === 'ADMIN' ? '/admin' : '/booster'

  function renderSidebar() {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn('p-4 border-b border-white/10 flex-shrink-0', collapsed && 'lg:px-3 lg:py-4')}>
          <Link href={dashboardHref} className="block">
            <h1 className={cn('text-lg font-black font-orbitron leading-none', collapsed && 'lg:hidden')} style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="text-brand-purple-light">GAME</span>
              <span className="text-white">BOOST</span>
            </h1>
            {collapsed && (
              <span className="hidden lg:block text-lg font-black font-orbitron text-brand-purple-light leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                G
              </span>
            )}
          </Link>
          {!collapsed && (
            <span className={cn('inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded font-rajdhani', roleBadgeClass)}>
              {roleLabel}
            </span>
          )}
        </div>

        <TooltipProvider delayDuration={0}>
          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              return (
                <div key={item.href}>
                  {item.separator && (
                    <div className="my-2 mx-3 border-t border-white/10" />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        className={cn(
                          'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium font-rajdhani border-l-2',
                          active
                            ? 'bg-brand-purple/20 text-brand-purple-light border-brand-purple'
                            : 'text-brand-gray-400 hover:text-white hover:bg-white/5 border-transparent',
                          collapsed && 'lg:justify-center lg:px-2'
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="bg-brand-black-light border-brand-purple/50 text-white lg:block hidden">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
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
                  <p className="text-sm text-white font-medium truncate">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-brand-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="hidden lg:flex justify-center mb-2">
                <div className="w-8 h-8 rounded-full bg-brand-purple/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-brand-purple-light">{userInitial}</span>
                </div>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-brand-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors font-rajdhani',
                    collapsed && 'lg:justify-center'
                  )}
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  <span className={cn(collapsed && 'lg:hidden')}>Sair</span>
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="bg-brand-black-light border-brand-purple/50 text-white lg:block hidden">
                  Sair
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-brand-black">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 bg-brand-black-light border-r border-white/10 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
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
        {/* Top bar */}
        <header className="h-14 bg-brand-black-light border-b border-white/10 flex items-center gap-3 px-4 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-brand-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            className="hidden lg:flex text-brand-gray-400 hover:text-white transition-colors"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1" />

          {/* Right side: notifications + avatar */}
          <NotificationBell />
          <div className="w-8 h-8 rounded-full bg-brand-purple/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-purple-light">{userInitial}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-brand-black">
          {children}
        </main>
      </div>
    </div>
  )
}
