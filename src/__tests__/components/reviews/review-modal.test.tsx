import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewModal } from '@/components/reviews/review-modal'

// Mock toast
jest.mock('@/lib/toast', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

global.fetch = jest.fn()

describe('ReviewModal', () => {
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
  })

  it('should render trigger button by default', () => {
    render(<ReviewModal orderId={123} />)

    expect(screen.getByRole('button', { name: 'Avaliar Pedido' })).toBeInTheDocument()
  })

  it('should open modal when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<ReviewModal orderId={123} />)

    const trigger = screen.getByRole('button', { name: 'Avaliar Pedido' })
    await user.click(trigger)

    expect(screen.getByText('Avaliar Serviço')).toBeInTheDocument()
    expect(screen.getByText('Sua Nota')).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<ReviewModal orderId={123} />)

    // Open modal
    await user.click(screen.getByRole('button', { name: 'Avaliar Pedido' }))

    // Submit without rating
    const submitButton = screen.getByRole('button', { name: 'Enviar Avaliação' })
    expect(submitButton).toBeDisabled()
  })

  it('should show comment field after opening modal', async () => {
    const user = userEvent.setup()
    render(<ReviewModal orderId={123} />)

    // Open modal
    await user.click(screen.getByRole('button', { name: 'Avaliar Pedido' }))

    // Check comment field is present
    const commentInput = screen.getByLabelText(/Comentário/i)
    expect(commentInput).toBeInTheDocument()
  })
})
