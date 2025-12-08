import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/common/page-header'

describe('PageHeader', () => {
  it('should render title', () => {
    render(<PageHeader title="Meus Pedidos" />)

    expect(screen.getByRole('heading', { name: /Meus Pedidos/i })).toBeInTheDocument()
  })

  it('should render description', () => {
    render(
      <PageHeader
        title="Dashboard"
        description="Acompanhe suas estatísticas"
      />
    )

    expect(screen.getByText('Acompanhe suas estatísticas')).toBeInTheDocument()
  })

  it('should render with highlight', () => {
    render(
      <PageHeader
        title="Dashboard"
        highlight="GAME"
      />
    )

    expect(screen.getByText('GAME')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('should have header styling', () => {
    render(<PageHeader title="Test" />)
    
    const heading = screen.getByRole('heading')
    expect(heading).toHaveClass('font-bold')
  })
})
