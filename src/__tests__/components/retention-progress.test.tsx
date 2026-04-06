import { render, screen } from '@testing-library/react'
import { RetentionProgress } from '@/components/common/retention-progress'

const makeOrder = (id: number, targetRating: number, gameMode = 'PREMIER', daysAgo = 1) => ({
  id,
  targetRating,
  targetRank: String(targetRating),
  gameMode,
  completedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
})

describe('RetentionProgress', () => {
  it('renders nothing when no orders match the gameMode', () => {
    const { container } = render(
      <RetentionProgress
        completedOrders={[makeOrder(1, 5000, 'GAMERS_CLUB')]}
        currentDiscountPct={0}
        gameMode="PREMIER"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when completedOrders is empty', () => {
    const { container } = render(
      <RetentionProgress completedOrders={[]} currentDiscountPct={0} gameMode="PREMIER" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows current rating from the latest completed order', () => {
    render(
      <RetentionProgress
        completedOrders={[makeOrder(1, 8000, 'PREMIER', 5), makeOrder(2, 12000, 'PREMIER', 1)]}
        currentDiscountPct={0}
        gameMode="PREMIER"
      />
    )
    // Latest order is 12000 pts — appears at least once (in rating display)
    const matches = screen.getAllByText(/12\.000 pts|12,000 pts/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows MAX when user is at the highest milestone (26000)', () => {
    render(
      <RetentionProgress
        completedOrders={[makeOrder(1, 26000, 'PREMIER')]}
        currentDiscountPct={0}
        gameMode="PREMIER"
      />
    )
    expect(screen.getByText(/máximo/i)).toBeInTheDocument()
  })

  it('shows next milestone label when not at max', () => {
    render(
      <RetentionProgress
        completedOrders={[makeOrder(1, 8000, 'PREMIER')]}
        currentDiscountPct={0}
        gameMode="PREMIER"
      />
    )
    // Next milestone after 8000 in PREMIER is 10000
    expect(screen.getByText(/10\.000 pts|10,000 pts/)).toBeInTheDocument()
  })

  it('shows discount badge when currentDiscountPct > 0', () => {
    render(
      <RetentionProgress
        completedOrders={[makeOrder(1, 8000, 'PREMIER')]}
        currentDiscountPct={0.1}
        gameMode="PREMIER"
      />
    )
    expect(screen.getByText(/10% de desconto/i)).toBeInTheDocument()
  })

  it('renders order timeline entries for multiple orders', () => {
    const orders = [
      makeOrder(1, 5000, 'PREMIER', 4),
      makeOrder(2, 7000, 'PREMIER', 3),
      makeOrder(3, 9000, 'PREMIER', 2),
    ]
    render(
      <RetentionProgress completedOrders={orders} currentDiscountPct={0} gameMode="PREMIER" />
    )
    // 5000 and 7000 only appear in the timeline (not in the rating display which shows latest = 9000)
    expect(screen.getByText(/5\.000 pts|5,000 pts/)).toBeInTheDocument()
    expect(screen.getByText(/7\.000 pts|7,000 pts/)).toBeInTheDocument()
    // 9000 appears in both rating display and timeline — use getAllByText
    const nineThousand = screen.getAllByText(/9\.000 pts|9,000 pts/)
    expect(nineThousand.length).toBeGreaterThan(0)
  })
})
