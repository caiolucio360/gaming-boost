import { render, screen, waitFor, within } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { CS2Calculator } from '@/components/games/cs2-calculator'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'CLIENT' } },
    status: 'authenticated',
    update: jest.fn(),
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock games config
jest.mock('@/lib/games-config', () => ({
  getGameConfig: () => ({
    id: 'CS2',
    name: 'Counter-Strike 2',
    displayName: 'CS2',
    modes: {
      PREMIER: {
        id: 'PREMIER',
        name: 'Premier',
        displayName: 'Premier',
        ratingPoints: [1000, 5000, 10000, 15000, 20000],
        pricingInfo: {
          unit: '1000 pontos',
          description: 'Preços progressivos por faixa de rating',
        },
      },
      GAMERS_CLUB: {
        id: 'GAMERS_CLUB',
        name: 'Gamers Club',
        displayName: 'Gamers Club',
        ratingPoints: [1, 2, 3, 4, 5, 10, 15, 20],
        ranks: [
          { id: 'iniciante', name: 'Iniciante', minPoints: 1, maxPoints: 3 },
        ],
        pricingInfo: {
          unit: '1 nível',
          description: 'Preços progressivos por faixa de nível',
        },
      }
    }
  }),
}))

// Mock pricing API
const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockImplementation((url) => {
    if (url.includes('/api/pricing/calculate')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ price: 40, pricePerUnit: 10, breakdown: [] }),
      })
    }
    if (url.includes('/api/orders')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ orders: [] }),
      })
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  })
})

describe('CS2Calculator', () => {
  it('should render calculator', () => {
    render(<CS2Calculator />)

    expect(screen.getByText(/CS2/i)).toBeInTheDocument()
    expect(screen.getByText(/CALCULATOR/i)).toBeInTheDocument()
  })

  it('should show price when ranks are selected', async () => {
    const user = userEvent.setup()
    render(<CS2Calculator />)

    // Find sections
    const currentTitle = screen.getByText(/PONTUAÇÃO ATUAL/i)
    const desiredTitle = screen.getByText(/PONTUAÇÃO DESEJADA/i)
    
    const currentSection = currentTitle.parentElement
    const desiredSection = desiredTitle.parentElement

    if (!currentSection || !desiredSection) throw new Error('Sections not found')
    expect(currentSection).not.toBe(desiredSection)

    // Select current rank (1000)
    const currentButton = within(currentSection).getByRole('button', { name: /^1K$/i })
    await user.click(currentButton)

    // Select desired rank (5000)
    const desiredButton = within(desiredSection).getByRole('button', { name: /^5K$/i })
    await user.click(desiredButton)

    // Click calculate
    const calculateButton = screen.getByRole('button', { name: /CALCULAR PREÇO/i })
    await user.click(calculateButton)

    // Price should be displayed (4000 diff / 1000 * 10 = 40)
    await waitFor(() => {
      expect(screen.getByText(/R\$ 40.00/i)).toBeInTheDocument()
    })
  })

  it('should add to cart when button is clicked', async () => {
    const user = userEvent.setup()
    render(<CS2Calculator />)

    // Find sections
    const currentTitle = screen.getByText(/PONTUAÇÃO ATUAL/i)
    const desiredTitle = screen.getByText(/PONTUAÇÃO DESEJADA/i)
    
    const currentSection = currentTitle.parentElement
    const desiredSection = desiredTitle.parentElement

    if (!currentSection || !desiredSection) throw new Error('Sections not found')

    // Select ranks
    await user.click(within(currentSection).getByRole('button', { name: /^1K$/i }))
    await user.click(within(desiredSection).getByRole('button', { name: /^5K$/i }))

    // Calculate
    await user.click(screen.getByRole('button', { name: /CALCULAR PREÇO/i }))

    // Hire
    await waitFor(() => {
      const hireButton = screen.getByRole('button', { name: /CONTRATAR AGORA/i })
      expect(hireButton).toBeInTheDocument()
    })
    
    const hireButton = screen.getByRole('button', { name: /CONTRATAR AGORA/i })
    await user.click(hireButton)
  })
})
