import { ReactNode } from 'react'
import { PageHeader } from '@/components/common/page-header'
import { BackButton } from '@/components/common/back-button'

interface AdminPageShellProps {
  title: string
  highlight?: string
  description?: string
  /** When set, renders a BackButton below the header (the /admin/pricing pattern). */
  backHref?: string
  backLabel?: string
  children: ReactNode
}

/**
 * Canonical admin page layout — container + PageHeader + optional BackButton.
 * Mirrors the /admin/pricing pattern so every admin screen shares the same chrome.
 */
export function AdminPageShell({
  title,
  highlight,
  description,
  backHref,
  backLabel = 'Voltar ao Dashboard',
  children,
}: AdminPageShellProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <PageHeader highlight={highlight} title={title} description={description} />
      {backHref && <BackButton href={backHref}>{backLabel}</BackButton>}
      {children}
    </div>
  )
}
