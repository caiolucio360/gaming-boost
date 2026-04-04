# App Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shared public marketing header for admin and booster routes with a dedicated app shell (sidebar + top bar) that provides persistent navigation and visual distinction from the public site.

**Architecture:** A `ConditionalShell` client component wraps the root layout's header/footer and hides them on `/admin/*` and `/booster/*` routes. An `AppShell` component renders a collapsible sidebar + top bar for those routes. Both admin and booster layouts instantiate `AppShell` with their own nav item configs. Page content loses its outer `min-h-screen` wrapper boilerplate — the shell provides the bg and spacing.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, `usePathname` (next/navigation), `useAuth` (existing), `localStorage` for collapse persistence, lucide-react icons, existing `NotificationBell` + `Tooltip` + `Tabs` components.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/layout/conditional-shell.tsx` | **Create** | Hides public header/footer/mobile-nav on app routes |
| `src/components/layout/app-shell.tsx` | **Create** | Sidebar + top bar shell for admin and booster |
| `src/app/layout.tsx` | **Modify** | Use ConditionalShell instead of rendering header/footer directly |
| `src/app/admin/layout.tsx` | **Modify** | Render AppShell with admin nav items |
| `src/app/admin/page.tsx` | **Modify** | Remove outer wrapper; remove nav link cards |
| `src/app/admin/orders/page.tsx` | **Modify** | Remove outer wrapper |
| `src/app/admin/orders/[id]/page.tsx` | **Modify** | Remove outer wrapper |
| `src/app/admin/users/page.tsx` | **Modify** | Remove outer wrapper |
| `src/app/admin/boosters/page.tsx` | **Modify** | Remove outer wrapper |
| `src/app/admin/payments/page.tsx` | **Modify** | Remove outer wrapper |
| `src/app/admin/pricing/page.tsx` | **Modify** | Remove outer wrapper (PricingPageSkeleton + main return) |
| `src/app/admin/commissions/page.tsx` | **Modify** | Remove outer wrapper |
| `src/app/booster/layout.tsx` | **Modify** | Render AppShell with booster nav items |
| `src/app/booster/page.tsx` | **Modify** | Remove outer wrapper; stat cards → pure stats; add Tabs bar; remove payments button |
| `src/app/booster/payments/page.tsx` | **Modify** | Remove outer wrapper |
| `src/app/booster/apply/page.tsx` | **Modify** | Remove outer wrapper |
| `src/app/dashboard/page.tsx` | **Modify** | Scrollable filter row |

---

## Task 1: ConditionalShell + Root Layout Update

**Files:**
- Create: `src/components/layout/conditional-shell.tsx`
- Modify: `src/app/layout.tsx`

This task creates the client component that conditionally renders the public header/footer/mobile-nav, and wires it into the root layout.

- [ ] **Step 1: Create `conditional-shell.tsx`**

```tsx
// src/components/layout/conditional-shell.tsx
'use client'

import { usePathname } from 'next/navigation'
import { ElojobHeader } from '@/components/layout/elojob-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

const APP_ROUTES = ['/admin', '/booster']

function isAppRoute(pathname: string) {
  return APP_ROUTES.some((route) => pathname.startsWith(route))
}

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const appRoute = isAppRoute(pathname)

  return (
    <>
      {!appRoute && <ElojobHeader />}
      <main
        id="main-content"
        className={appRoute ? 'flex-1' : 'flex-1 pt-16 pb-24 lg:pb-0'}
        role="main"
        aria-label="Conteúdo principal"
      >
        {children}
      </main>
      {!appRoute && <Footer />}
      {!appRoute && <MobileBottomNav />}
    </>
  )
}
```

- [ ] **Step 2: Update `src/app/layout.tsx`**

Replace the current `<ElojobHeader />`, `<main>`, `<Footer />`, `<MobileBottomNav />` block with `<ConditionalShell>`.

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Orbitron, Rajdhani } from 'next/font/google'
import './globals.css'
import { AuthProviderWrapper } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { SkipLink } from '@/components/common/skip-link'
import { LiveRegion } from '@/components/common/live-region'
import { ConditionalShell } from '@/components/layout/conditional-shell'
import { QueryProvider } from '@/providers/query-provider'
import { generateMetadata } from '@/lib/seo'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '700', '800', '900'],
  display: 'swap',
  preload: true,
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = generateMetadata({
  title: 'GameBoost - Serviços de Boost para Jogos',
  description: 'Plataforma profissional para serviços de boost em Counter-Strike 2. Boost de rank Premier e Gamers Club com boosters verificados. Entrega rápida e segura. Mais de 10.000 clientes satisfeitos.',
  keywords: [
    'counter strike 2', 'cs2', 'counter strike', 'cs', 'cs2 boost',
    'cs2 rank boost', 'cs2 premier boost', 'cs2 gamers club boost',
    'cs2 boost profissional', 'cs2 boost seguro', 'cs2 boost rapido',
    'boost cs2', 'boost counter strike 2', 'elo job cs2', 'rank boost cs2',
    'boost premier cs2', 'boost gamers club', 'serviço de boost',
    'boost profissional', 'boost seguro cs2', 'elo job', 'elojob',
    'elojob cs2', 'gameboost',
  ],
  canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${orbitron.variable} ${rajdhani.variable} font-rajdhani text-white bg-black`}>
        <QueryProvider>
          <AuthProviderWrapper>
            <ToastProvider />
            <SkipLink />
            <LiveRegion message="" id="live-region" />
            <div className="min-h-screen flex flex-col overflow-x-hidden">
              <ConditionalShell>
                {children}
              </ConditionalShell>
            </div>
          </AuthProviderWrapper>
        </QueryProvider>
        <AnalyticsProvider />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify public pages still work**

Run `npm run dev` and visit `http://localhost:3000`. Confirm:
- Public header is visible on `/`
- Footer is visible on `/`
- No errors in terminal

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/conditional-shell.tsx src/app/layout.tsx
git commit -m "feat: add ConditionalShell to hide public header/footer on app routes"
```

---

## Task 2: AppShell Component

**Files:**
- Create: `src/components/layout/app-shell.tsx`

The full sidebar + top bar shell. Sidebar is collapsible on desktop and a drawer on mobile. Collapse state persists in localStorage.

- [ ] **Step 1: Create `app-shell.tsx`**

```tsx
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

  function SidebarContent() {
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

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          <TooltipProvider delayDuration={0}>
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
          </TooltipProvider>
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-3 flex-shrink-0">
          <TooltipProvider delayDuration={0}>
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
          </TooltipProvider>
        </div>
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
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-60 bg-brand-black-light border-r border-white/10 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```
Expected: No errors (the file is not yet used, so this just checks syntax).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/app-shell.tsx
git commit -m "feat: add AppShell component with collapsible sidebar and top bar"
```

---

## Task 3: Admin Layout

**Files:**
- Modify: `src/app/admin/layout.tsx`

Wire AppShell into the admin route group. This is a server component that renders the client AppShell with admin nav config.

- [ ] **Step 1: Replace `src/app/admin/layout.tsx`**

```tsx
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
```

- [ ] **Step 2: Navigate to `/admin` in dev server**

Run `npm run dev`, log in as admin, visit `http://localhost:3000/admin`. Confirm:
- Sidebar appears on the left
- Public header is gone
- All nav items appear
- Sidebar collapse toggle works on desktop
- Hamburger opens drawer on mobile

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat: add AppShell to admin layout with sidebar navigation"
```

---

## Task 4: Remove Outer Wrappers from All Admin Pages

**Files:**
- Modify: `src/app/admin/page.tsx` (line 118)
- Modify: `src/app/admin/orders/page.tsx` (line 136)
- Modify: `src/app/admin/orders/[id]/page.tsx` (line 196 or 212)
- Modify: `src/app/admin/users/page.tsx` (line 210)
- Modify: `src/app/admin/boosters/page.tsx` (line 170)
- Modify: `src/app/admin/payments/page.tsx` (line 213)
- Modify: `src/app/admin/pricing/page.tsx` (lines 82 and 515)
- Modify: `src/app/admin/commissions/page.tsx` (line 200)

Each page currently wraps its content in `<div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">`. Remove that outer div and keep its direct children. The AppShell's `<main>` provides the `bg-brand-black` background; each page's inner padding/max-width div is kept as-is.

- [ ] **Step 1: `src/app/admin/orders/page.tsx`**

Find (around line 136):
```tsx
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
```
Replace with:
```tsx
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
```
And remove the matching `</div></div>` at the end, replacing with a single `</div>`.

- [ ] **Step 2: `src/app/admin/orders/[id]/page.tsx`**

Find the outer wrapper (around line 196 or 212 — check with the Read tool):
```tsx
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
```
Remove that outer div, keeping its children. The page's inner content already has its own padding/max-width structure.

- [ ] **Step 3: `src/app/admin/users/page.tsx`**

Find (around line 210):
```tsx
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
```
Replace with:
```tsx
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
```
Remove one closing `</div>` at the end.

- [ ] **Step 4: `src/app/admin/boosters/page.tsx`**

Find (around line 170):
```tsx
        <div className="min-h-screen bg-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="max-w-7xl mx-auto">
```
Replace with:
```tsx
        <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
```
Remove one closing `</div>`.

- [ ] **Step 5: `src/app/admin/payments/page.tsx`**

Find (around line 213):
```tsx
    <div className="min-h-screen bg-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
```
Replace with:
```tsx
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
```
Remove one closing `</div>`.

- [ ] **Step 6: `src/app/admin/pricing/page.tsx` — two places**

**6a. The `PricingPageSkeleton` function** (around line 82):
```tsx
// Before:
    <div className="min-h-screen bg-brand-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

// After:
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
```
Remove one closing `</div>` at the end of that skeleton function.

**6b. The main return** (around line 515):
```tsx
// Before:
    <div className="min-h-screen bg-brand-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

// After:
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
```
Remove one closing `</div>` at the end of the component.

- [ ] **Step 7: `src/app/admin/commissions/page.tsx`**

Find (around line 200):
```tsx
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-4xl mx-auto">
```
Replace with:
```tsx
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
```
Remove one closing `</div>`.

- [ ] **Step 8: `src/app/admin/page.tsx`**

Find (around line 118):
```tsx
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
```
Replace with:
```tsx
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
```
Remove one closing `</div>`. (We handle nav card removal in Task 5.)

- [ ] **Step 9: Build check**

```bash
npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 10: Verify admin pages in browser**

Visit each admin page and confirm: no extra whitespace at top/bottom, content fills correctly, no double-padding.

- [ ] **Step 11: Commit**

```bash
git add src/app/admin/
git commit -m "refactor: remove min-h-screen outer wrappers from all admin pages"
```

---

## Task 5: Admin Dashboard — Remove Nav Cards

**Files:**
- Modify: `src/app/admin/page.tsx`

The nav cards (Usuários, Pedidos, Receitas, Comissões, Boosters, Preços) are navigation that now lives in the sidebar. Remove them. Keep: stats grid, recent orders table, and the pending orders alert.

- [ ] **Step 1: Remove the nav cards grid from `src/app/admin/page.tsx`**

Find and delete the entire block:
```tsx
        {/* Cards de Ações Rápidas - Modern Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-8 lg:mb-10">
          
          {/* Gerenciar Usuários */}
          <Link href="/admin/users" className="group">
            ...
          </Link>

          {/* Gerenciar Pedidos */}
          <Link href="/admin/orders" className="group">
            ...
          </Link>

          {/* Receitas */}
          <Link href="/admin/payments" className="group">
            ...
          </Link>

          {/* Gerenciar Comissões */}
          <Link href="/admin/commissions">
            ...
          </Link>

          {/* Aplicações de Booster */}
          <Link href="/admin/boosters" className="group">
            ...
          </Link>

          {/* Configuração de Preços */}
          <Link href="/admin/pricing" className="group">
            ...
          </Link>

        </div>
```
Delete this entire block (from the `{/* Cards de Ações Rápidas */}` comment through the closing `</div>`).

- [ ] **Step 2: Add pending orders alert above recent orders**

In the stats section, after the stats grid closing `</div>`, add:

```tsx
        {/* Alert: pedidos pagos aguardando booster */}
        {stats.orders.pending > 0 && (
          <Alert className="mb-6 bg-amber-500/10 border-amber-500/50">
            <AlertTitle className="text-amber-400 font-orbitron text-sm">
              {stats.orders.pending} pedido{stats.orders.pending > 1 ? 's' : ''} aguardando booster
            </AlertTitle>
            <AlertDescription className="text-brand-gray-300 font-rajdhani text-sm">
              Há pedidos pagos sem booster atribuído.{' '}
              <Link href="/admin/orders" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                Ver pedidos →
              </Link>
            </AlertDescription>
          </Alert>
        )}
```

Make sure `Alert`, `AlertTitle`, `AlertDescription` are already imported (they are — check line ~25 of the current file). If not, add: `import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'`

- [ ] **Step 3: Remove imports that are no longer used**

After removing the nav cards, these imports are no longer needed in `admin/page.tsx`:
- `ArrowRight` from lucide-react (used only in nav cards)

Remove it from the import line.

- [ ] **Step 4: Verify in browser**

Visit `/admin`. Confirm:
- No navigation link cards
- Stats grid shows (4 cards: users, orders, revenue, dev revenue if applicable)
- Pending orders alert shows if `stats.orders.pending > 0`
- Recent orders table below

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "refactor: remove nav link cards from admin dashboard; add pending orders alert"
```

---

## Task 6: Booster Layout

**Files:**
- Modify: `src/app/booster/layout.tsx`

- [ ] **Step 1: Replace `src/app/booster/layout.tsx`**

```tsx
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
```

- [ ] **Step 2: Navigate to `/booster` in dev server**

Log in as a booster and visit `http://localhost:3000/booster`. Confirm:
- Amber "BOOSTER" role badge in sidebar header
- 3 nav items visible
- Public header gone
- "Meu Perfil" links to `/profile` (public route, opens in same tab)

- [ ] **Step 3: Commit**

```bash
git add src/app/booster/layout.tsx
git commit -m "feat: add AppShell to booster layout with sidebar navigation"
```

---

## Task 7: Remove Outer Wrappers from Booster Pages

**Files:**
- Modify: `src/app/booster/page.tsx` (line 351)
- Modify: `src/app/booster/payments/page.tsx` (line 224)
- Modify: `src/app/booster/apply/page.tsx` (line 5)

- [ ] **Step 1: `src/app/booster/payments/page.tsx`**

Find (around line 224):
```tsx
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
```
Replace with:
```tsx
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
```
Remove one closing `</div>`.

- [ ] **Step 2: `src/app/booster/apply/page.tsx`**

Find (around line 5):
```tsx
    <div className="min-h-screen bg-brand-black py-12 px-4 sm:px-6 lg:px-8">
```
Replace with:
```tsx
    <div className="py-12 px-4 sm:px-6 lg:px-8">
```

- [ ] **Step 3: `src/app/booster/page.tsx`**

Find (around line 351):
```tsx
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
```
Replace with:
```tsx
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
```
Remove one closing `</div>`. (Booster dashboard refactor in Task 8.)

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit
```
Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/booster/
git commit -m "refactor: remove min-h-screen outer wrappers from all booster pages"
```

---

## Task 8: Booster Dashboard Refactor

**Files:**
- Modify: `src/app/booster/page.tsx`

Three changes: (1) remove the "Ver Meus Pagamentos" button, (2) convert the 3 tab-nav stat cards to pure display cards, (3) add a proper `<Tabs>` bar above the order list.

- [ ] **Step 1: Remove the "Ver Meus Pagamentos" button**

Find and delete:
```tsx
        {/* Link para Pagamentos */}
        <div className="mb-6">
          <Link href="/booster/payments">
            <Button className="bg-gradient-to-r from-brand-purple to-brand-purple-light text-white shadow-lg border border-transparent hover:border-white/50 transition-all duration-200">
              <DollarSign className="h-4 w-4 mr-2" />
              Ver Meus Pagamentos
            </Button>
          </Link>
        </div>
```
Delete the entire block.

- [ ] **Step 2: Convert the 3 tab-nav stat cards to pure display cards**

Find the three `<Card onClick={() => setActiveTab(...)}>` cards. Replace each with a static card (no onClick, no cursor-pointer, no conditional styling based on activeTab).

**Replace card 1 (Disponíveis):**
```tsx
            {/* Card - Disponíveis */}
            <Card className="bg-brand-black/30 border-yellow-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-gray-500 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Disponíveis
                    </p>
                    <p className="text-3xl font-bold text-yellow-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {stats.available}
                    </p>
                    <p className="text-xs text-brand-gray-500 mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Pedidos pendentes
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-yellow-500/60" />
                </div>
              </CardContent>
            </Card>
```

**Replace card 2 (Em Andamento):**
```tsx
            {/* Card - Em Andamento */}
            <Card className="bg-brand-black/30 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-gray-500 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Em Andamento
                    </p>
                    <p className="text-3xl font-bold text-blue-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {stats.assigned}
                    </p>
                    <p className="text-xs text-brand-gray-500 mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Pedidos ativos
                    </p>
                  </div>
                  <Loader2 className="h-8 w-8 text-blue-500/60" />
                </div>
              </CardContent>
            </Card>
```

**Replace card 3 (Concluídos):**
```tsx
            {/* Card - Concluídos */}
            <Card className="bg-brand-black/30 border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-gray-500 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Concluídos
                    </p>
                    <p className="text-3xl font-bold text-green-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {stats.completed}
                    </p>
                    <p className="text-xs text-brand-gray-500 mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Pedidos finalizados
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500/60" />
                </div>
              </CardContent>
            </Card>
```

- [ ] **Step 3: Add Tabs bar above the order list sections**

The order list sections currently start with `{activeTab === 'available' && (...)`. Add a Tabs bar above them. The `<Tabs>` component is already imported in many pages — check if it's imported; if not add: `import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'`

Add this block between the stats grid closing `</div>` (after `) : null}`) and the first order list section `{/* Pedidos Disponíveis */}`:

```tsx
        {/* Tabs de navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-brand-black-light border border-brand-purple/30 rounded-lg p-1 gap-1 h-auto">
            <TabsTrigger
              value="available"
              className="font-rajdhani font-bold transition-all duration-200 rounded-md py-2 px-4
                data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                data-[state=inactive]:text-brand-gray-500 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-brand-purple/20"
            >
              Disponíveis
              {stats && stats.available > 0 && (
                <span className="ml-2 bg-yellow-500/20 text-yellow-300 text-xs px-1.5 py-0.5 rounded font-bold">
                  {stats.available}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="assigned"
              className="font-rajdhani font-bold transition-all duration-200 rounded-md py-2 px-4
                data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                data-[state=inactive]:text-brand-gray-500 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-brand-purple/20"
            >
              Em Andamento
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="font-rajdhani font-bold transition-all duration-200 rounded-md py-2 px-4
                data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                data-[state=inactive]:text-brand-gray-500 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-brand-purple/20"
            >
              Concluídos
            </TabsTrigger>
          </TabsList>
        </Tabs>
```

- [ ] **Step 4: Add `Tabs` import if not present**

Check imports at top of `src/app/booster/page.tsx`. If `Tabs, TabsList, TabsTrigger` are not imported, add:
```tsx
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
```

- [ ] **Step 5: Verify in browser**

Visit `/booster` as a booster:
- Stat cards are not clickable (no pointer cursor, no active state change)
- Tabs bar shows above order list
- Clicking tabs switches between Disponíveis/Em Andamento/Concluídos
- "Ver Meus Pagamentos" button is gone
- Sidebar "Pagamentos" link works

- [ ] **Step 6: Commit**

```bash
git add src/app/booster/page.tsx
git commit -m "refactor: booster dashboard — pure stat cards, proper Tabs bar, remove payments button"
```

---

## Task 9: Client Dashboard Filter Row — Scrollable

**Files:**
- Modify: `src/app/dashboard/page.tsx` (around line 237)

The filter buttons use `flex flex-wrap` which causes wrapping on medium screens. Change to a horizontally scrollable row.

- [ ] **Step 1: Make the filter buttons row horizontally scrollable**

Find (around line 237):
```tsx
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-brand-purple-light mr-1" />
```

Replace with:
```tsx
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap">
                <Filter className="h-4 w-4 text-brand-purple-light mr-1 flex-shrink-0" />
```

Add `flex-shrink-0` to each button inside this div to prevent them from shrinking:

Find each button `className={` starting with `px-3 py-1.5 rounded-md` and add `flex-shrink-0` to each button's className string. There are 6 buttons (Todos, Pendentes, Pagos, Em Progresso, Concluídos, Cancelados).

For the "Todos" button, change:
```tsx
                  className={`px-3 py-1.5 rounded-md font-rajdhani text-xs font-medium transition-colors duration-200 ${
```
to:
```tsx
                  className={`flex-shrink-0 px-3 py-1.5 rounded-md font-rajdhani text-xs font-medium transition-colors duration-200 ${
```

Do the same for each of the remaining 5 filter buttons (PENDING, PAID, IN_PROGRESS, COMPLETED, CANCELLED).

- [ ] **Step 2: Verify in browser**

Visit `/dashboard` on a medium-width viewport (~768px). Confirm filter buttons scroll horizontally instead of wrapping to a second line.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "fix: make dashboard filter buttons horizontally scrollable instead of wrapping"
```

---

## Task 10: Final Build Check

- [ ] **Step 1: Run full build**

```bash
npm run build
```
Expected: Successful build, no TypeScript errors, no missing module errors.

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: All existing tests pass. (AppShell and ConditionalShell don't need tests — they're layout components with no business logic.)

- [ ] **Step 3: Manual smoke test checklist**

- [ ] `/admin` — sidebar visible, no public header, stats shown, no nav cards
- [ ] `/admin/orders` — sidebar active on "Pedidos", content renders
- [ ] `/admin/users` — sidebar active on "Usuários", content renders
- [ ] `/admin/boosters` — sidebar active on "Boosters", content renders
- [ ] `/admin/payments` — sidebar active on "Pagamentos", content renders
- [ ] `/admin/pricing` — sidebar active on "Precificação", content renders
- [ ] `/admin/commissions` — sidebar active on "Comissões", content renders
- [ ] `/admin` sidebar collapse — collapses to 64px icons, persists on refresh
- [ ] Admin "Preview do Site" → opens `/games/cs2` in new tab
- [ ] `/booster` — amber sidebar visible, stat cards not clickable, Tabs bar works
- [ ] `/booster/payments` — sidebar active on "Pagamentos"
- [ ] `/booster/apply` — sidebar active on nothing (not a nav item), page renders
- [ ] Mobile `/admin` — hamburger opens drawer, backdrop closes it
- [ ] Mobile `/booster` — same
- [ ] `/` (public) — public header and footer visible, mobile bottom nav works
- [ ] `/games/cs2` — public header visible
- [ ] `/dashboard` — public header visible, filter buttons scroll on narrow viewport

- [ ] **Step 4: Commit if not already done**

All tasks above commit individually. If any uncommitted changes remain:
```bash
git add -A
git commit -m "chore: final cleanup"
```

---

## Self-Review

**Spec coverage:**
- ✅ AppShell component with sidebar (240px open, 64px collapsed) + top bar + mobile drawer
- ✅ ConditionalShell hides public header/footer/mobile-nav on app routes
- ✅ Admin layout with 7 nav items + Preview do Site external link
- ✅ Admin dashboard: nav cards removed, pending orders alert added
- ✅ Booster layout with 3 nav items (Meus Trabalhos, Pagamentos, Meu Perfil)
- ✅ Booster dashboard: stat cards non-clickable, Tabs bar added, payments button removed
- ✅ Sidebar collapse persists in localStorage
- ✅ Active nav detection via usePathname (exact for roots, startsWith for sections)
- ✅ Role badges: purple for ADMIN, amber for BOOSTER
- ✅ Client filter buttons: scrollable row
- ✅ All outer page wrappers removed (11 pages)

**Placeholder scan:** No TBDs, no vague steps, all code shown.

**Type consistency:**
- `NavItem` interface defined in `app-shell.tsx` and re-exported — both layouts import `NavItem` from same file ✅
- `AppShellProps.role` is `'ADMIN' | 'BOOSTER'` — used consistently ✅
- `logout` from `useAuth()` is called directly (no args) — matches existing auth-context API ✅
