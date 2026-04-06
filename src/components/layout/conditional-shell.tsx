'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ElojobHeader } from '@/components/layout/elojob-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

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
    // App shell (admin/booster): fixed height, no browser scroll
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <main
          id="main-content"
          className="flex-1 flex flex-col overflow-hidden"
          aria-label="Conteúdo principal"
        >
          {children}
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
