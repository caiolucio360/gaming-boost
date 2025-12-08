import { render, screen } from '@testing-library/react'
import GamesSection from '@/components/layout/gamesSection'

describe('GamesSection', () => {
  it('should render games section', () => {
    render(<GamesSection />)

    // Check that the heading is rendered
    expect(screen.getByText(/Jogos Disponíveis/i)).toBeInTheDocument()
  })

  it('should display section heading', () => {
    render(<GamesSection />)

    expect(screen.getByRole('heading', { name: /Jogos Disponíveis/i })).toBeInTheDocument()
  })

  it('should show game cards', () => {
    render(<GamesSection />)

    expect(screen.getByText(/Counter-Strike 2/i)).toBeInTheDocument()
  })

  it('should have links to game pages', () => {
    render(<GamesSection />)

    const gameLinks = screen.getAllByRole('link')
    expect(gameLinks.length).toBeGreaterThan(0)
  })
})
