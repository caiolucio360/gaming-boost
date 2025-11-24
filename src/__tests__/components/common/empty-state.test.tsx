import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/common/empty-state'
import { PackageOpen } from 'lucide-react'

describe('EmptyState', () => {
  it('should render with title and description', () => {
    render(
      <EmptyState
        icon={PackageOpen}
        title="Nenhum pedido encontrado"
        description="Você ainda não fez nenhum pedido"
      />
    )

    expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument()
    expect(screen.getByText('Você ainda não fez nenhum pedido')).toBeInTheDocument()
  })

  it('should render with custom icon', () => {
    const { container } = render(
      <EmptyState
        icon={PackageOpen}
        title="Sem itens"
        description="Nenhum item disponível"
      />
    )

    // Icon should be rendered as an svg
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('should render with action button', () => {
    const mockAction = jest.fn()
    render(
      <EmptyState
        icon={PackageOpen}
        title="Carrinho vazio"
        description="Adicione itens ao carrinho"
        actionLabel="Ver Serviços"
        onAction={mockAction}
      />
    )

    const button = screen.getByRole('button', { name: /Ver Serviços/i })
    expect(button).toBeInTheDocument()
  })

  it('should call action onClick when button is clicked', () => {
    const mockAction = jest.fn()
    render(
      <EmptyState
        icon={PackageOpen}
        title="Vazio"
        description="Descrição"
        actionLabel="Ação"
        onAction={mockAction}
      />
    )

    const button = screen.getByRole('button', { name: /Ação/i })
    button.click()

    expect(mockAction).toHaveBeenCalledTimes(1)
  })
})
