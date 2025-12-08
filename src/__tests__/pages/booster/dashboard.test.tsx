import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BoosterDashboardPage from '@/app/booster/page'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { useRealtime } from '@/hooks/use-realtime'
import { useRouter } from 'next/navigation'

// Mock hooks
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))
jest.mock('@/hooks/use-loading', () => ({
  useLoading: jest.fn(),
}))
jest.mock('@/hooks/use-realtime', () => ({
  useRealtime: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}))
jest.mock('@/components/ui/tabs', () => {
  const React = require('react')
  const TabsContext = React.createContext({ value: '' })
  
  return {
    Tabs: ({ children, onValueChange, value }: any) => (
      <TabsContext.Provider value={{ value }}>
        <div data-testid="tabs" data-value={value}>
          <button onClick={() => onValueChange('available')}>Tab Available</button>
          <button onClick={() => onValueChange('assigned')}>Tab Assigned</button>
          <button onClick={() => onValueChange('completed')}>Tab Completed</button>
          {children}
        </div>
      </TabsContext.Provider>
    ),
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children }: any) => <div>{children}</div>,
    TabsContent: ({ children, value }: any) => (
      <TabsContext.Consumer>
        {({ value: selectedValue }: any) => 
          value === selectedValue ? <div data-content={value}>{children}</div> : null
        }
      </TabsContext.Consumer>
    ),
  }
})
jest.mock('@/components/common/stat-card', () => ({
  StatCard: ({ title, value }: any) => <div data-testid="stat-card">{title}: {value}</div>,
}))
jest.mock('@/components/common/status-badge', () => ({
  StatusBadge: ({ status }: any) => <div>Status: {status}</div>,
}))
jest.mock('@/components/common/page-header', () => ({
  PageHeader: ({ title }: any) => <h1>{title}</h1>,
}))
jest.mock('@/components/common/loading-spinner', () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}))
jest.mock('@/components/common/empty-state', () => ({
  EmptyState: ({ title }: any) => <div>{title}</div>,
}))
jest.mock('@/components/common/loading-skeletons', () => ({
  OrdersListSkeleton: () => <div>Skeleton List</div>,
  StatsGridSkeleton: () => <div>Skeleton Stats</div>,
}))
jest.mock('@/components/common/confirm-dialog', () => ({
  ConfirmDialog: ({ open, onConfirm }: any) => open ? <div data-testid="confirm-dialog"><button onClick={onConfirm}>Confirm</button></div> : null,
}))
jest.mock('@/components/common/action-button', () => ({
  ActionButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}))
jest.mock('@/components/common/refreshing-banner', () => ({
  RefreshingBanner: () => <div>Refreshing...</div>,
}))
jest.mock('@/components/common/order-info-item', () => ({
  OrderInfoItem: ({ label, value }: any) => <div>{label}: {value}</div>,
}))

// Mock fetch
global.fetch = jest.fn()

describe('BoosterDashboardPage', () => {
  const mockRouter = { replace: jest.fn() }
  const mockUser = { id: 1, name: 'Booster', email: 'booster@test.com', role: 'BOOSTER' }
  const mockWithLoading = jest.fn((fn) => fn())

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false })
    ;(useLoading as jest.Mock).mockReturnValue({ loading: false, refreshing: false, withLoading: mockWithLoading })
    ;(useRealtime as jest.Mock).mockReturnValue({})
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        orders: [],
        stats: { available: 0, assigned: 0, completed: 0, totalEarnings: 0, pendingEarnings: 0 }
      }),
    })
  })

  it('should redirect if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false })
    render(<BoosterDashboardPage />)
    expect(mockRouter.replace).toHaveBeenCalledWith('/login')
  })

  it('should redirect if not booster', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'CLIENT' }, loading: false })
    render(<BoosterDashboardPage />)
    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard')
  })

  it('should render dashboard for booster', async () => {
    render(<BoosterDashboardPage />)
    expect(screen.getByText('TRABALHOS')).toBeInTheDocument()
    expect(screen.getByText('Ver Meus Pagamentos')).toBeInTheDocument()
  })

  it('should fetch orders on mount', async () => {
    render(<BoosterDashboardPage />)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/booster/orders'))
    })
  })

  it('should display stats', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        orders: [],
        stats: { available: 5, assigned: 2, completed: 10, totalEarnings: 1000, pendingEarnings: 200 }
      }),
    })

    render(<BoosterDashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Disponíveis: 5')).toBeInTheDocument()
      expect(screen.getByText('Em Andamento: 2')).toBeInTheDocument()
      expect(screen.getByText('Concluídos: 10')).toBeInTheDocument()
    })
  })

  it('should display orders list', async () => {
    const mockOrders = [
      {
        id: 1,
        status: 'PAID',
        total: 100,
        service: { name: 'Boost CS2', description: 'Rank Boost', game: 'CS2' },
        user: { name: 'Client' },
        createdAt: '2023-01-01',
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        orders: mockOrders,
        stats: { available: 1, assigned: 0, completed: 0, totalEarnings: 0, pendingEarnings: 0 }
      }),
    })

    render(<BoosterDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Boost CS2')).toBeInTheDocument()
      expect(screen.getByText('Rank Boost')).toBeInTheDocument()
      expect(screen.getByText('Status: PAID')).toBeInTheDocument()
    })
  })
})
