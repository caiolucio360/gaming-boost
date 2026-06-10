import * as React from 'react'
import { cn } from '@/lib/utils'

interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns at the `lg` breakpoint (1 / 2 on smaller screens). */
  columns?: 2 | 3 | 4 | 5
}

const lgColumns: Record<NonNullable<StatsGridProps['columns']>, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

/** Responsive grid wrapper for KPI/stat cards — standardizes the dashboard stat layout. */
export function StatsGrid({ columns = 4, className, ...props }: StatsGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6',
        lgColumns[columns],
        className
      )}
      {...props}
    />
  )
}
