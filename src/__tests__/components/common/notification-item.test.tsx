import { render, screen } from '@testing-library/react'
import { NotificationItem } from '@/components/common/notification-item'

const mockNotification = {
  id: 1,
  type: 'SYSTEM' as const,
  title: 'Pagamento Confirmado',
  message: 'Seu pagamento foi confirmado com sucesso',
  read: false,
  createdAt: new Date('2024-01-01T12:00:00Z'),
}

describe('NotificationItem', () => {
  it('should render notification title and message', () => {
    render(<NotificationItem notification={mockNotification} />)

    expect(screen.getByText('Pagamento Confirmado')).toBeInTheDocument()
    expect(screen.getByText(/pagamento foi confirmado/i)).toBeInTheDocument()
  })

  it('should show unread indicator for unread notifications', () => {
    const { container } = render(<NotificationItem notification={mockNotification} />)

    // The unread indicator is a div with specific classes, no role
    // We can check if the title has font-semibold which indicates unread
    const title = screen.getByText('Pagamento Confirmado')
    expect(title).toHaveClass('font-semibold')
  })

  it('should not show unread indicator for read notifications', () => {
    const readNotification = { ...mockNotification, read: true }
    render(<NotificationItem notification={readNotification} />)

    const title = screen.getByText('Pagamento Confirmado')
    expect(title).not.toHaveClass('font-semibold')
  })

  it('should display time ago', () => {
    render(<NotificationItem notification={mockNotification} />)

    // Should show relative time
    expect(screen.getByText(/há/)).toBeInTheDocument()
  })

  it('should have correct icon for SYSTEM notification', () => {
    const { container } = render(<NotificationItem notification={mockNotification} />)

    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('should call onRead when notification is clicked', () => {
    const mockOnRead = jest.fn()
    render(<NotificationItem notification={mockNotification} onRead={mockOnRead} />)

    const notification = screen.getByText('Pagamento Confirmado').closest('div')
    // The click handler is on the outer div
    // We need to find the clickable element.
    // The component has onClick on the outer div.
    // Let's click the title's parent's parent... or just the text.
    // Events bubble up.
    
    const title = screen.getByText('Pagamento Confirmado')
    title.click()

    expect(mockOnRead).toHaveBeenCalledWith(1)
  })
})
