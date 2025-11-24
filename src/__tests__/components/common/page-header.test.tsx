import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/common/page-header'

describe('PageHeader', () => {
  it('should render title', () => {
    render(<PageHeader title="Meus Pedidos" />)

    expect(screen.getByRole('heading', { name: 'Meus Pedidos' })).toBeInTheDocument()
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

  it('should render action button', () => {
    render(
      <PageHeader
        title="Pedidos"
        action={<button>Criar Novo</button>}
      />
    )

    expect(screen.getByRole('button', { name: 'Criar Novo' })).toBeInTheDocument()
  })

  it('should render breadcrumb', () => {
    render(
      <PageHeader
        title="Pedidos"
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Pedidos', href: '/pedidos' },
        ]}
      />
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Pedidos')).toBeInTheDocument()
  })
})
