import { render, screen } from '@testing-library/react'
import { DashboardCard } from '@/components/common/dashboard-card'

describe('DashboardCard', () => {
  it('should render with title', () => {
    render(<DashboardCard title="Meus Pedidos" />)

    expect(screen.getByText('Meus Pedidos')).toBeInTheDocument()
  })

  it('should render children content', () => {
    render(
      <DashboardCard title="Test Card">
        <div>Card Content</div>
      </DashboardCard>
    )

    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('should render with description', () => {
    render(
      <DashboardCard
        title="Pedidos"
        description="Veja todos os seus pedidos aqui"
      />
    )

    expect(screen.getByText('Veja todos os seus pedidos aqui')).toBeInTheDocument()
  })

  it('should render with action button', () => {
    render(
      <DashboardCard
        title="Pedidos"
        action={<button>Ver Todos</button>}
      />
    )

    expect(screen.getByRole('button', { name: 'Ver Todos' })).toBeInTheDocument()
  })

  it('should have correct styling', () => {
    const { container } = render(<DashboardCard title="Test" />)

    const card = container.firstChild
    expect(card).toHaveClass('bg-black/30')
  })
})
