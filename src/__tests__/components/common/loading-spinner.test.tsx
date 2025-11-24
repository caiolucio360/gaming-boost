import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '@/components/common/loading-spinner'

describe('LoadingSpinner', () => {
  it('should render loading spinner', () => {
    render(<LoadingSpinner />)

    // Check for the spinner icon (Loader2 from lucide-react)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render with custom text', () => {
    render(<LoadingSpinner text="Carregando dados..." />)

    expect(screen.getByText('Carregando dados...')).toBeInTheDocument()
  })

  it('should render small size', () => {
    const { container } = render(<LoadingSpinner size="sm" fullScreen={false} />)

    const spinner = container.querySelector('.h-4')
    expect(spinner).toBeInTheDocument()
  })

  it('should render large size', () => {
    const { container } = render(<LoadingSpinner size="lg" fullScreen={false} />)

    const spinner = container.querySelector('.h-12')
    expect(spinner).toBeInTheDocument()
  })

  it('should render fullscreen when specified', () => {
    const { container } = render(<LoadingSpinner fullScreen />)

    const wrapper = container.querySelector('.min-h-screen')
    expect(wrapper).toBeInTheDocument()
  })

  it('should not render fullscreen when false', () => {
    const { container } = render(<LoadingSpinner fullScreen={false} />)

    const wrapper = container.querySelector('.min-h-screen')
    expect(wrapper).not.toBeInTheDocument()
  })
})
