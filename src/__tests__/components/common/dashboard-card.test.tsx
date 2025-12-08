import { render, screen } from '@testing-library/react'
import { DashboardCard } from '@/components/common/dashboard-card'

describe('DashboardCard', () => {
  it('should render with title', () => {
    render(<DashboardCard title="Meus Pedidos"><div>Content</div></DashboardCard>)

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
      >
        <div>Content</div>
      </DashboardCard>
    )

    expect(screen.getByText('Veja todos os seus pedidos aqui')).toBeInTheDocument()
  })

  it('should render with status PENDING styling', () => {
    const { container } = render(
      <DashboardCard title="Test" status="PENDING">
        <div>Content</div>
      </DashboardCard>
    )

    const card = container.firstChild
    expect(card).toHaveClass('border-yellow-500/50')
  })

  it('should render with status PAID styling', () => {
    const { container } = render(
      <DashboardCard title="Test" status="PAID">
        <div>Content</div>
      </DashboardCard>
    )

    const card = container.firstChild
    expect(card).toHaveClass('border-cyan-500/50')
  })

  it('should render with status IN_PROGRESS styling', () => {
    const { container } = render(
      <DashboardCard title="Test" status="IN_PROGRESS">
        <div>Content</div>
      </DashboardCard>
    )

    const card = container.firstChild
    expect(card).toHaveClass('border-blue-500/50')
  })
})
