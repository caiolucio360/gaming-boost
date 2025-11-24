import { render, screen, waitFor } from '@testing-library/react'
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

  it('should render notification bell icon', () => {
    render(<NotificationBell />)

    const bellIcon = screen.getByRole('button', { name: /notificações/i })
    expect(bellIcon).toBeInTheDocument()
  })

  it('should show unread count badge', async () => {
    render(<NotificationBell />)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('should open popover when clicked', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    const bell = screen.getByRole('button', { name: /notificações/i })
    await user.click(bell)

    await waitFor(() => {
      expect(screen.getByText('Notificações')).toBeInTheDocument()
    })
  })

  it('should display notifications in popover', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    const bell = screen.getByRole('button', { name: /notificações/i })
    await user.click(bell)

    await waitFor(() => {
      expect(screen.getByText('Pagamento Confirmado')).toBeInTheDocument()
      expect(screen.getByText(/pagamento foi processado/i)).toBeInTheDocument()
    })
  })

  it('should mark notification as read when clicked', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    const bell = screen.getByRole('button', { name: /notificações/i })
    await user.click(bell)

    await waitFor(() => {
      expect(screen.getByText('Pagamento Confirmado')).toBeInTheDocument()
    })

    const notification = screen.getByText('Pagamento Confirmado')
    await user.click(notification)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })
  })

  it('should show "Ver todas" link', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    const bell = screen.getByRole('button', { name: /notificações/i })
    await user.click(bell)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Ver todas/i })).toBeInTheDocument()
    })
  })

  it('should not show badge when no unread notifications', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [],
        unreadCount: 0,
      }),
    })

    render(<NotificationBell />)

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })
})
