import { render, screen } from '@testing-library/react'
import { GamesSection } from '@/components/layout/gamesSection'

describe('GamesSection', () => {
  it('should render games section', () => {
    render(<GamesSection />)

    expect(screen.getByRole('region', { name: /Jogos/i })).toBeInTheDocument()
  })

  it('should display section heading', () => {
    render(<GamesSection />)

    expect(screen.getByRole('heading', { name: /Nossos Jogos/i })).toBeInTheDocument()
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

  it('should display game images', () => {
    render(<GamesSection />)

    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })
})
