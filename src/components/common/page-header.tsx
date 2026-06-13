interface PageHeaderProps {
  title: string
  highlight?: string
  description?: string
  className?: string
}

export function PageHeader({ title, highlight, description, className }: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className || ''}`}>
      <h1 className="text-4xl font-extrabold text-foreground font-orbitron mb-2">
        {highlight && <span className="text-brand-purple-light">{highlight} </span>}
        <span className="text-foreground">{title}</span>
      </h1>
      {description && (
        <p className="text-muted-foreground font-rajdhani font-medium">
          {description}
        </p>
      )}
    </div>
  )
}

