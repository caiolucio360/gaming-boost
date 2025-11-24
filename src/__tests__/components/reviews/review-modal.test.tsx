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

  it('should submit review with valid data', async () => {
    const user = userEvent.setup()
    render(<ReviewModal orderId={123} onSuccess={mockOnSuccess} />)

    // Open modal
    await user.click(screen.getByRole('button', { name: 'Avaliar Pedido' }))

    // Select 5 stars
    // We assume the stars are buttons. Since there are 5 stars, we pick the last one.
    // The component renders 5 buttons for stars.
    // However, they might not have accessible names.
    // Let's try to find them by role button inside the dialog.
    // The dialog has a close button (maybe), 5 stars, and submit button.
    // Let's use a more specific selector if possible or just try getAllByRole('button') and filter.
    
    // In the component:
    // <button key={star} ... > <Star ... /> </button>
    // They don't have text content.
    
    // Let's try to click the 5th button that contains an SVG with 'lucide-star' class? No.
    // Let's assume the buttons without text are the stars.
    
    const buttons = screen.getAllByRole('button')
    // Filter buttons that are likely stars (no text content)
    const starButtons = buttons.filter(b => !b.textContent)
    
    // Assuming the 5 star buttons are among these.
    if (starButtons.length >= 5) {
        await user.click(starButtons[4])
    }

    // Add comment
    const commentInput = screen.getByLabelText(/Comentário/i)
    await user.type(commentInput, 'Ótimo serviço!')

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Enviar Avaliação' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reviews',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"rating":5'),
        })
      )
    })
  })
})
