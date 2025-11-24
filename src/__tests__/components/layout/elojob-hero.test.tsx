import { render, screen } from '@testing-library/react'
import { ElojobHero } from '@/components/layout/elojob-hero'

describe('ElojobHero', () => {
  it('should render hero section', () => {
    render(<ElojobHero />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('should display main heading', () => {
    render(<ElojobHero />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })

  it('should show CTA button', () => {
    render(<ElojobHero />)

    const ctaButton = screen.getByRole('link', { name: /Começar Agora/i })
    expect(ctaButton).toBeInTheDocument()
  })

  it('should have correct link for CTA', () => {
    render(<ElojobHero />)

    const ctaButton = screen.getByRole('link', { name: /Começar Agora/i })
    expect(ctaButton).toHaveAttribute('href', '/games/cs2')
  })

  it('should display hero description', () => {
    render(<ElojobHero />)

    expect(screen.getByText(/Boost profissional/i)).toBeInTheDocument()
  })
})
