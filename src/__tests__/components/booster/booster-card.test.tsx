import { render, screen } from '@testing-library/react'
import { BoosterCard } from '@/components/booster/booster-card'

const mockBooster = {
  id: 1,
  userId: 42,
  user: {
    name: 'TestBooster',
    image: null,
  },
  completedOrders: 15,
  languages: ['PT', 'EN'],
  verificationStatus: 'VERIFIED',
}

describe('BoosterCard', () => {
  it('renders booster name', () => {
    render(<BoosterCard booster={mockBooster} />)
    expect(screen.getByText('TestBooster')).toBeInTheDocument()
  })

  it('renders completed orders count', () => {
    render(<BoosterCard booster={mockBooster} />)
    expect(screen.getByText(/15 pedidos/i)).toBeInTheDocument()
  })

  it('renders language badges', () => {
    render(<BoosterCard booster={mockBooster} />)
    expect(screen.getByText('PT')).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('shows verified badge for VERIFIED booster', () => {
    render(<BoosterCard booster={mockBooster} />)
    expect(screen.getByText(/verificado/i)).toBeInTheDocument()
  })

  it('does not show verified badge for unverified booster', () => {
    render(<BoosterCard booster={{ ...mockBooster, verificationStatus: 'PENDING' }} />)
    expect(screen.queryByText(/verificado/i)).not.toBeInTheDocument()
  })

  it('is not wrapped in a link (profile page removed)', () => {
    const { container } = render(<BoosterCard booster={mockBooster} />)
    // The card should not be inside an <a> tag pointing to /booster/[id]
    const links = container.querySelectorAll('a[href*="/booster/"]')
    expect(links).toHaveLength(0)
  })

  it('renders fallback initials when no image', () => {
    render(<BoosterCard booster={mockBooster} />)
    expect(screen.getByText('TE')).toBeInTheDocument()
  })
})
