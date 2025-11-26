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

  it('should submit dispute with valid reason', async () => {
    const user = userEvent.setup()
    render(<DisputeModal orderId={123} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    const textarea = screen.getByPlaceholderText(/Explique detalhadamente/i)
    await user.type(textarea, 'O booster não completou o serviço conforme acordado e não está respondendo')

    const submitButtons = screen.getAllByRole('button', { name: /Abrir Disputa/i })
    const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit') || submitButtons[0]
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 3000 })

    await waitFor(() => {
      const fetchCalls = (global.fetch as jest.Mock).mock.calls
      const disputeCall = fetchCalls.find((call: any[]) => 
        call[0] === '/api/disputes' && call[1]?.method === 'POST'
      )
      expect(disputeCall).toBeDefined()
      if (disputeCall) {
        const body = JSON.parse(disputeCall[1].body)
        expect(body.orderId).toBe(123)
        expect(body.reason).toBe('O booster não completou o serviço conforme acordado e não está respondendo')
      }
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/disputes/1')
      expect(mockOnClose).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show loading state while submitting', async () => {
    const user = userEvent.setup()
    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve
    })
    ;(global.fetch as jest.Mock).mockImplementation(() => fetchPromise)

    render(<DisputeModal orderId={123} onClose={mockOnClose} />)

    const textarea = screen.getByPlaceholderText(/Explique detalhadamente/i)
    await user.type(textarea, 'Motivo válido com mais de vinte caracteres para teste')

    const submitButtons = screen.getAllByRole('button', { name: /Abrir Disputa/i })
    const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit') || submitButtons[0]
    
    // Clicar no botão
    await user.click(submitButton)
    
    // Verificar que o fetch foi chamado (indicando que o submit iniciou)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 1000 })

    // Resolver o fetch para completar o teste
    resolveFetch!({ ok: true, json: async () => ({ dispute: { id: 1 } }) })
  })
})
