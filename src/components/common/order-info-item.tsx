'use client'

interface OrderInfoItemProps {
  label: string
  value: string | React.ReactNode
  valueClassName?: string
}

/**
 * Item de informação reutilizável para cards de pedidos
 */
export function OrderInfoItem({ label, value, valueClassName = 'text-foreground' }: OrderInfoItemProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground font-rajdhani mb-1">
        {label}
      </p>
      <p className={`text-sm font-rajdhani ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}

