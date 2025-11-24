import { render, screen } from '@testing-library/react'
import { ButtonLoading } from '@/components/common/button-loading'

describe('ButtonLoading', () => {
  it('should render button with text', () => {
    render(<ButtonLoading>Click Me</ButtonLoading>)

    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument()
  })

  it('should be disabled when loading', () => {
    render(<ButtonLoading loading>Submit</ButtonLoading>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should show spinner when loading', () => {
    const { container } = render(<ButtonLoading loading>Submit</ButtonLoading>)

    // Check for Loader2 icon with animate-spin class
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should show loading text when provided', () => {
    render(<ButtonLoading loading loadingText="Processando...">Submit</ButtonLoading>)

    expect(screen.getByText('Processando...')).toBeInTheDocument()
  })

  it('should not show spinner when not loading', () => {
    const { container } = render(<ButtonLoading>Submit</ButtonLoading>)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).not.toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const mockOnClick = jest.fn()
    render(<ButtonLoading onClick={mockOnClick}>Click</ButtonLoading>)

    const button = screen.getByRole('button')
    button.click()

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick when loading', () => {
    const mockOnClick = jest.fn()
    render(<ButtonLoading loading onClick={mockOnClick}>Click</ButtonLoading>)

    const button = screen.getByRole('button')
    button.click()

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<ButtonLoading disabled>Click</ButtonLoading>)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})
