import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DisputeModal } from '@/components/disputes/dispute-modal'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

global.fetch = jest.fn()

describe('DisputeModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()
  const mockPush = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ 
      push: mockPush,
      replace: mockReplace,
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ dispute: { id: 1 } }),
    })
  })

  it('should render dispute modal', () => {
    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    expect(screen.getAllByText(/Abrir Disputa/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Pedido #123/i)).toBeInTheDocument()
  })

  it('should show important warning', () => {
    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    expect(screen.getByText(/Importante:/i)).toBeInTheDocument()
    expect(screen.getByText(/problemas sérios/i)).toBeInTheDocument()
  })

  it('should show validation error for short reason', async () => {
    const user = userEvent.setup()
    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    const textarea = screen.getByPlaceholderText(/Explique detalhadamente/i)
    await user.type(textarea, 'Muito curto')

    const submitButton = screen.getAllByRole('button', { name: /Abrir Disputa/i })[0]
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Por favor, descreva o problema com no mínimo 20 caracteres/i)).toBeInTheDocument()
    })
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show textarea for reason input', () => {
    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    const textarea = screen.getByPlaceholderText(/Explique detalhadamente/i)
    expect(textarea).toBeInTheDocument()
  })
})
