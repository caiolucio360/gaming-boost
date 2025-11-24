import { render, screen } from '@testing-library/react'
import { FeaturedServicesSection } from '@/components/layout/featuredServicesSection'

// Mock ServiceCard component
jest.mock('@/components/games/service-card', () => ({
  ServiceCard: ({ service }: any) => <div data-testid="service-card">{service.name}</div>,
}))

const mockServices = [
  { id: 1, name: 'CS2 Boost', game: 'CS2', price: 100 },
  { id: 2, name: 'Valorant Boost', game: 'Valorant', price: 150 },
]

describe('FeaturedServicesSection', () => {
  it('should render section title', () => {
    render(<FeaturedServicesSection services={mockServices} />)

    expect(screen.getByText(/Serviços em Destaque/i)).toBeInTheDocument()
  })

  it('should render service cards', () => {
    render(<FeaturedServicesSection services={mockServices} />)

    const cards = screen.getAllByTestId('service-card')
    expect(cards).toHaveLength(2)
  })

  it('should show empty state when no services', () => {
    render(<FeaturedServicesSection services={[]} />)

    expect(screen.getByText(/Nenhum serviço disponível/i)).toBeInTheDocument()
  })

  it('should display service names', () => {
    render(<FeaturedServicesSection services={mockServices} />)

    expect(screen.getByText('CS2 Boost')).toBeInTheDocument()
    expect(screen.getByText('Valorant Boost')).toBeInTheDocument()
  })
})
