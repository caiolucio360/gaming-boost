import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/common/stat-card'
import { DollarSign } from 'lucide-react'

describe('StatCard', () => {
  it('should render title and value', () => {
    render(<StatCard title="Total de Vendas" value="R$ 1.500,00" />)

    expect(screen.getByText('Total de Vendas')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument()
  })

  it('should render with icon', () => {
    render(
      <StatCard
        title="Receita"
        value="R$ 5.000,00"
        icon={<DollarSign data-testid="icon" />}
      />
    )

    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('should render positive change', () => {
    render(<StatCard title="Vendas" value="100" change={15} />)

    expect(screen.getByText(/\+15%/i)).toBeInTheDocument()
  })

  it('should render negative change', () => {
    render(<StatCard title="Pedidos" value="50" change={-10} />)

    expect(screen.getByText(/-10%/i)).toBeInTheDocument()
  })

  it('should render description', () => {
    render(
      <StatCard
        title="Usuários Ativos"
        value="250"
        description="Últimos 30 dias"
      />
    )

    expect(screen.getByText('Últimos 30 dias')).toBeInTheDocument()
  })

  it('should have correct styling for positive change', () => {
    const { container } = render(<StatCard title="Test" value="100" change={5} />)

    const changeElement = screen.getByText(/\+5%/i)
    expect(changeElement).toHaveClass('text-green-400')
  })

  it('should have correct styling for negative change', () => {
    const { container } = render(<StatCard title="Test" value="100" change={-5} />)

    const changeElement = screen.getByText(/-5%/i)
    expect(changeElement).toHaveClass('text-red-400')
  })
})
