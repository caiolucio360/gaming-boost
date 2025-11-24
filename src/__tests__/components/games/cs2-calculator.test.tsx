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
        name: 'Premier',
        displayName: 'Premier',
        ratingPoints: [1000, 5000, 10000, 15000, 20000],
        pricingRules: {
          basePrice: 10,
          unit: 1000,
          calculation: (current: number, target: number) => {
            if (current >= target) return 0
            return ((target - current) / 1000) * 10
          }
        }
      }
    }
  }),
}))

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
