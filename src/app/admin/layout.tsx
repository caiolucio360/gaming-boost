// src/app/admin/layout.tsx
import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = generateMetadata({
  title: 'Painel Administrativo - GameBoost',
  description: 'Painel administrativo da GameBoost.',
  noindex: true,
})

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="ADMIN">
      {children}
    </AppShell>
  )
}
