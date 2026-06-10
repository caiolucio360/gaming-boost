import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlowCard } from '@/components/common/glow-card'
import { StatusBadge, OrderStatus } from '@/components/common/status-badge'

interface OrderCardShellProps {
  title: string
  description?: string
  status: OrderStatus
  /** Use the purple hover-glow surface (default) or a plain card. */
  glow?: boolean
  children: ReactNode
}

/**
 * Order card shell: the repeated card surface + header (title, description and
 * order `StatusBadge`) shared by the booster/dashboard/admin order lists. Body
 * content (info grid, actions, chat) goes in `children`.
 */
export function OrderCardShell({
  title,
  description,
  status,
  glow = true,
  children,
}: OrderCardShellProps) {
  const inner = (
    <>
      <CardHeader className={glow ? 'relative z-10' : undefined}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="mb-2 group-hover:text-brand-purple-light transition-colors duration-200">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="group-hover:text-brand-gray-300 transition-colors duration-200">
                {description}
              </CardDescription>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className={glow ? 'relative z-10' : undefined}>{children}</CardContent>
    </>
  )

  if (glow) {
    return <GlowCard className="hover:shadow-xl hover:shadow-brand-purple/20">{inner}</GlowCard>
  }
  return (
    <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light transition-colors">
      {inner}
    </Card>
  )
}
