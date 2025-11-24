import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/layout/footer'

describe('Footer', () => {
  it('should render footer', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('should display copyright', () => {
    render(<Footer />)

    expect(screen.getByText(/©.*GameBoost Pro/i)).toBeInTheDocument()
  })

  it('should have navigation links', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: /Sobre/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Contato/i })).toBeInTheDocument()
  })

  it('should show privacy policy link', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: /Privacidade/i })).toBeInTheDocument()
  })

  it('should show terms of service link', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: /Termos/i })).toBeInTheDocument()
  })

  it('should display social media links', () => {
    render(<Footer />)

    // Should have social media icons
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(4) // At least nav + social links
  })
})
