/**
 * Admin page smoke test — renders without crashing.
 */

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 99, name: 'Admin', email: 'admin@admin.com', role: 'ADMIN' },
    loading: false,
  })),
}))

jest.mock('@/hooks/use-loading', () => ({
  useLoading: jest.fn(() => ({
    loading: false,
    refreshing: false,
    withLoading: (fn: () => Promise<void>) => fn(),
  })),
}))

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({
    stats: { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 },
    orders: [],
    users: [],
  }),
} as any)

import { render } from '@testing-library/react'
import AdminPage from '@/app/admin/page'

describe('Admin page smoke test', () => {
  it('renders without crashing when authenticated as ADMIN', () => {
    expect(() => render(<AdminPage />)).not.toThrow()
  })
})
