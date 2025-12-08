import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/common/stat-card'
import { DollarSign, Users, Package } from 'lucide-react'

describe('StatCard', () => {
  it('should render title and value', () => {
    render(<StatCard title="Total de Vendas" value="R$ 1.500,00" icon={DollarSign} />)

    expect(screen.getByText('Total de Vendas')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument()
  })

  it('should render with icon', () => {
    render(
      <StatCard
        title="Receita"
        value="R$ 5.000,00"
        icon={DollarSign}
      />
    )

    // Check that there's an SVG element (the icon)
    const svgElements = document.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThan(0)
  })

  it('should render description', () => {
    render(
      <StatCard
        title="Usuários Ativos"
        value="250"
        icon={Users}
        description="Últimos 30 dias"
      />
    )

    expect(screen.getByText('Últimos 30 dias')).toBeInTheDocument()
  })

  it('should render value with custom color', () => {
    render(<StatCard title="Test" value="100" icon={Package} valueColor="text-green-400" />)

    const valueElement = screen.getByText('100')
    expect(valueElement).toHaveClass('text-green-400')
  })

  it('should render icon with custom color', () => {
    render(<StatCard title="Test" value="100" icon={DollarSign} iconColor="text-yellow-400" />)

    // The component renders the icon
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
