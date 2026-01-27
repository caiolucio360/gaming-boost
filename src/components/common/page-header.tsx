interface PageHeaderProps {
  title: string
  highlight?: string
  description?: string
  className?: string
}

export function PageHeader({ title, highlight, description, className }: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className || ''}`}>
      <h1 className="text-4xl font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
        {highlight && <span className="text-brand-purple-light">{highlight} </span>}
        <span className="text-white">{title}</span>
      </h1>
      {description && (
        <p className="text-brand-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
          {description}
        </p>
      )}
    </div>
  )
}

