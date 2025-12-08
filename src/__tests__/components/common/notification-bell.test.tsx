import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationBell } from '@/components/common/notification-bell'
import { useAuth } from '@/contexts/auth-context'

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

global.fetch = jest.fn()
global.EventSource = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
})) as any

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'João' },
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [
          {
            id: 1,
            type: 'SYSTEM',
            title: 'Pagamento Confirmado',
            message: 'Seu pagamento foi processado',
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      }),
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render notification bell icon', async () => {
    await act(async () => {
      render(<NotificationBell />)
    })

    const bellIcon = screen.getByRole('button', { name: /notificações/i })
    expect(bellIcon).toBeInTheDocument()
  })

  it('should show unread count badge', async () => {
    await act(async () => {
      render(<NotificationBell />)
    })

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should not show badge when no unread notifications', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [],
        unreadCount: 0,
      }),
    })

    await act(async () => {
      render(<NotificationBell />)
    })

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
