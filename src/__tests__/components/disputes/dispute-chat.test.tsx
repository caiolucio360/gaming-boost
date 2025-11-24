import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DisputeChat } from '@/components/disputes/dispute-chat'
import { useAuth } from '@/contexts/auth-context'

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

global.fetch = jest.fn()

const mockDispute = {
  id: 1,
  orderId: 123,
  reason: 'Serviço não foi completado',
  status: 'OPEN',
  createdAt: '2024-01-01T12:00:00Z',
  creator: { id: 1, name: 'João', image: null },
  order: {
    id: 123,
    total: 280,
    status: 'IN_PROGRESS',
    user: { id: 1, name: 'João', image: null },
    booster: { id: 2, name: 'Maria', image: null },
  },
  messages: [
    {
      id: 1,
      content: 'Olá, preciso de ajuda',
      authorId: 1,
      author: { id: 1, name: 'João', image: null },
      createdAt: '2024-01-01T12:00:00Z',
    },
  ],
}

describe('DisputeChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'João', role: 'CLIENT' },
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ dispute: mockDispute }),
    })
  })

  it('should render dispute information', async () => {
    render(<DisputeChat disputeId={1} />)

    await waitFor(() => {
      expect(screen.getByText(/Disputa #1/i)).toBeInTheDocument()
    })
  })

  it('should display dispute reason', async () => {
    render(<DisputeChat disputeId={1} />)

    await waitFor(() => {
      expect(screen.getByText('Serviço não foi completado')).toBeInTheDocument()
    })
  })

  it('should show messages', async () => {
    render(<DisputeChat disputeId={1} />)

    await waitFor(() => {
      expect(screen.getByText('Olá, preciso de ajuda')).toBeInTheDocument()
    })
  })

  it('should allow sending a message when dispute is open', async () => {
    const user = userEvent.setup()
    render(<DisputeChat disputeId={1} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Digite sua mensagem/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Digite sua mensagem/i)
    await user.type(input, 'Nova mensagem de teste')

    const form = screen.getByRole('button').closest('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/disputes/1/messages',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('should not allow sending messages when dispute is resolved', async () => {
    const resolvedDispute = { ...mockDispute, status: 'RESOLVED_REFUND' }
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ dispute: resolvedDispute }),
    })

    render(<DisputeChat disputeId={1} />)

    await waitFor(() => {
      expect(screen.getByText(/disputa foi resolvida/i)).toBeInTheDocument()
    })

    expect(screen.queryByPlaceholderText(/Digite sua mensagem/i)).not.toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    render(<DisputeChat disputeId={1} />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should poll for new messages', async () => {
    jest.useFakeTimers()
    render(<DisputeChat disputeId={1} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/disputes/1')
    })

    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    jest.useRealTimers()
  })
})
