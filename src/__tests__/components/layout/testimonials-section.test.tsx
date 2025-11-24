import { render, screen } from '@testing-library/react'
import { TestimonialsSection } from '@/components/layout/testimonialsSection'

const mockTestimonials = [
  {
    id: 1,
    name: 'João Silva',
    rating: 5,
    comment: 'Excelente serviço!',
    avatar: '/avatar1.jpg',
  },
  {
    id: 2,
    name: 'Maria Santos',
    rating: 4,
    comment: 'Muito bom!',
    avatar: '/avatar2.jpg',
  },
]

describe('TestimonialsSection', () => {
  it('should render testimonials section', () => {
    render(<TestimonialsSection testimonials={mockTestimonials} />)

    expect(screen.getByText(/Depoimentos/i)).toBeInTheDocument()
  })

  it('should display testimonial names', () => {
    render(<TestimonialsSection testimonials={mockTestimonials} />)

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Maria Santos')).toBeInTheDocument()
  })

  it('should show testimonial comments', () => {
    render(<TestimonialsSection testimonials={mockTestimonials} />)

    expect(screen.getByText('Excelente serviço!')).toBeInTheDocument()
    expect(screen.getByText('Muito bom!')).toBeInTheDocument()
  })

  it('should display ratings', () => {
    render(<TestimonialsSection testimonials={mockTestimonials} />)

    // Should have star icons for ratings
    const stars = screen.getAllByRole('img', { name: /star/i })
    expect(stars.length).toBeGreaterThan(0)
  })

  it('should show empty state when no testimonials', () => {
    render(<TestimonialsSection testimonials={[]} />)

    expect(screen.getByText(/Nenhum depoimento/i)).toBeInTheDocument()
  })

  it('should render avatars', () => {
    render(<TestimonialsSection testimonials={mockTestimonials} />)

    const avatars = screen.getAllByRole('img', { name: /avatar/i })
    expect(avatars.length).toBe(2)
  })
})
