'use client'

import { usePathname } from 'next/navigation'
import { ElojobHeader } from '@/components/layout/elojob-header'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

// Only admin and booster routes get the app shell.
// Client routes (/dashboard, /cart, /payment) intentionally keep the public header.
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
        aria-label="Conteúdo principal"
      >
        {children}
      </main>
      {!appRoute && <Footer />}
      {!appRoute && <MobileBottomNav />}
    </>
  )
}
