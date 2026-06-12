'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ElojobHeader } from '@/components/layout/elojob-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { AppShell } from '@/components/layout/app-shell'

// Admin and booster-scoped routes always get the app shell.
const APP_ROUTES = ['/admin', '/booster']

// Shared routes that also get the app shell for admin/booster users.
const SHARED_ROUTES = ['/notifications', '/profile']

function isAppRoute(pathname: string, role?: string) {
  if (APP_ROUTES.some((route) => pathname.startsWith(route))) return true
  if (SHARED_ROUTES.some((route) => pathname.startsWith(route))) {
    return role === 'ADMIN' || role === 'BOOSTER'
  }
  return false
}

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as string | undefined
  const appRoute = isAppRoute(pathname, role)

  if (appRoute) {
    // Shared pages (/profile, /notifications) live outside the /admin and /booster
    // segment layouts, so they don't inherit the sidebar AppShell from there. For
    // admin/booster users, wrap them in the same AppShell here so they stay inside
    // the panel layout (sidebar + top bar). Dedicated /admin and /booster routes
    // already get the AppShell from their own segment layout — don't double-wrap.
    const sharedContentRoute = SHARED_ROUTES.some((route) => pathname.startsWith(route))
    const wrapInShell = sharedContentRoute && (role === 'ADMIN' || role === 'BOOSTER')

    // App shell (admin/booster): fixed height; the AppShell's inner <main> scrolls.
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <main
          id="main-content"
          className="flex-1 flex flex-col overflow-hidden"
          aria-label="Conteúdo principal"
        >
          {wrapInShell ? (
            <AppShell role={role as 'ADMIN' | 'BOOSTER'}>{children}</AppShell>
          ) : (
            children
          )}
        </main>
      </div>
    )
  }

  // Public pages: natural document flow, browser scroll
  return (
    <div className="min-h-screen flex flex-col">
      <ElojobHeader />
      <main
        id="main-content"
        className="flex-1 pt-16 pb-24 lg:pb-0"
        aria-label="Conteúdo principal"
      >
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
