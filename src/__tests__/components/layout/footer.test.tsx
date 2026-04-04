import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/layout/footer'

// Next.js Link renders as <a> in tests
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('Footer', () => {
  beforeEach(() => {
    render(<Footer />)
  })

  it('has /terms link', () => {
    expect(screen.getByRole('link', { name: /termos de uso/i })).toHaveAttribute('href', '/terms')
  })

  it('has /privacy link', () => {
    expect(screen.getByRole('link', { name: /política de privacidade/i })).toHaveAttribute('href', '/privacy')
  })

  it('does not have /contact link', () => {
    const links = screen.getAllByRole('link')
    const contactLink = links.find(l => l.getAttribute('href') === '/contact')
    expect(contactLink).toBeUndefined()
  })

  it('renders copyright notice', () => {
    expect(screen.getByText(/GameBoost/i)).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })
})
