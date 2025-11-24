import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ dispute: { id: 1 } }),
    })
  })

  it('should render dispute modal', () => {
    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    expect(screen.getByText(/Abrir Disputa/i)).toBeInTheDocument()
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

    const submitButton = screen.getByRole('button', { name: /Abrir Disputa/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/no mínimo 20 caracteres/i)).toBeInTheDocument()
    })
  })

  it('should submit dispute with valid reason', async () => {
    const user = userEvent.setup()
    render(<DisputeModal orderId={123} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    const textarea = screen.getByPlaceholderText(/Explique detalhadamente/i)
    await user.type(textarea, 'O booster não completou o serviço conforme acordado e não está respondendo')

    const submitButton = screen.getByRole('button', { name: /Abrir Disputa/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/disputes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            orderId: 123,
            reason: 'O booster não completou o serviço conforme acordado e não está respondendo',
          }),
        })
      )
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/disputes/1')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should disable buttons while submitting', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({ dispute: { id: 1 } }) }), 100))
    )

    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    const textarea = screen.getByPlaceholderText(/Explique detalhadamente/i)
    await user.type(textarea, 'Motivo válido com mais de vinte caracteres para teste')

    const submitButton = screen.getByRole('button', { name: /Abrir Disputa/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled()
  })
})
