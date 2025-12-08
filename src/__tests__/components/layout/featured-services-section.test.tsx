import { render, screen } from '@testing-library/react'
import FeaturedServicesSection from '@/components/layout/featuredServicesSection'

describe('FeaturedServicesSection', () => {
  it('should render section title', () => {
    render(<FeaturedServicesSection />)

    expect(screen.getByText(/Serviços em Destaque/i)).toBeInTheDocument()
  })

  it('should render service cards', () => {
    render(<FeaturedServicesSection />)

    // Component has hardcoded services: BOOST DE RANK and COACHING
    expect(screen.getByText('BOOST DE RANK')).toBeInTheDocument()
    expect(screen.getByText('COACHING')).toBeInTheDocument()
  })

  it('should display service descriptions', () => {
    render(<FeaturedServicesSection />)

    expect(screen.getByText(/Subimos seu rank de forma segura/i)).toBeInTheDocument()
  })

  it('should show contratar button for available service', () => {
    render(<FeaturedServicesSection />)

    expect(screen.getByRole('link', { name: /Contratar Agora/i })).toBeInTheDocument()
  })
})
