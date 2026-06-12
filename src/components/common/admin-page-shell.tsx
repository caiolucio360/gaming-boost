import { ReactNode } from 'react'
import { PageHeader } from '@/components/common/page-header'

interface AdminPageShellProps {
  title: string
  highlight?: string
  description?: string
  children: ReactNode
}

/**
 * Canonical admin page layout — container + PageHeader.
 * Navigation back to the dashboard is provided by the admin AppShell, so the
 * shell itself no longer renders a back button.
 */
export function AdminPageShell({
  title,
  highlight,
  description,
  children,
}: AdminPageShellProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <PageHeader highlight={highlight} title={title} description={description} />
      {children}
    </div>
  )
}
