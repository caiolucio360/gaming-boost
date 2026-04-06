/**
 * Smoke tests — verify pages render without crashing.
 * These test client components that require auth and data fetching.
 */

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 1, name: 'User', email: 'u@u.com', role: 'CLIENT' },
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

jest.mock('@/lib/api-client', () => ({
  apiGet: jest.fn().mockResolvedValue({ data: { orders: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } } }),
  getAuthToken: jest.fn().mockReturnValue('mock-token'),
}))

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ orders: [], pagination: { total: 0 } }),
} as any)

import { render } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

describe('Dashboard page smoke test', () => {
  it('renders without crashing when authenticated as CLIENT', () => {
    expect(() => render(<DashboardPage />)).not.toThrow()
  })
})
