import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/common/status-badge'

describe('StatusBadge', () => {
  it('should render PENDING status', () => {
    render(<StatusBadge status="PENDING" />)

    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('should render IN_PROGRESS status', () => {
    render(<StatusBadge status="IN_PROGRESS" />)

    expect(screen.getByText('Em Progresso')).toBeInTheDocument()
  })

  it('should render COMPLETED status', () => {
    render(<StatusBadge status="COMPLETED" />)

    expect(screen.getByText('Concluído')).toBeInTheDocument()
  })

  it('should render CANCELLED status', () => {
    render(<StatusBadge status="CANCELLED" />)

    expect(screen.getByText('Cancelado')).toBeInTheDocument()
  })

  it('should have correct color for PENDING', () => {
    const { container } = render(<StatusBadge status="PENDING" />)

    const badge = container.querySelector('.bg-yellow-500\\/20')
    expect(badge).toBeInTheDocument()
  })

  it('should have correct color for IN_PROGRESS', () => {
    const { container } = render(<StatusBadge status="IN_PROGRESS" />)

    const badge = container.querySelector('.bg-blue-500\\/20')
    expect(badge).toBeInTheDocument()
  })

  it('should have correct color for COMPLETED', () => {
    const { container } = render(<StatusBadge status="COMPLETED" />)

    const badge = container.querySelector('.bg-green-500\\/20')
    expect(badge).toBeInTheDocument()
  })

  it('should have correct color for CANCELLED', () => {
    const { container } = render(<StatusBadge status="CANCELLED" />)

    const badge = container.querySelector('.bg-red-500\\/20')
    expect(badge).toBeInTheDocument()
  })
})
