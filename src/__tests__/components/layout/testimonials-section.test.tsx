import { render, screen } from '@testing-library/react'
import TestimonialsSection from '@/components/layout/testimonialsSection'

describe('TestimonialsSection', () => {
  it('should render testimonials section', () => {
    render(<TestimonialsSection />)

    expect(screen.getByText(/Depoimentos/i)).toBeInTheDocument()
  })

  it('should display testimonial names', () => {
    render(<TestimonialsSection />)

    // Component has hardcoded testimonials with these names
    expect(screen.getByText('Carlos Silva')).toBeInTheDocument()
    expect(screen.getByText('Ana Santos')).toBeInTheDocument()
  })

  it('should show testimonial text', () => {
    render(<TestimonialsSection />)

    expect(screen.getByText(/Serviço incrível/i)).toBeInTheDocument()
  })

  it('should display stats section', () => {
    render(<TestimonialsSection />)

    expect(screen.getByText('1000+')).toBeInTheDocument()
    expect(screen.getByText(/Clientes Satisfeitos/i)).toBeInTheDocument()
  })
})
