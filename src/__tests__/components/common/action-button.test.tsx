import { render, screen } from '@testing-library/react'
import { ActionButton } from '@/components/common/action-button'

describe('ActionButton', () => {
  it('should render button with text', () => {
    render(<ActionButton>Click Me</ActionButton>)

    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const mockOnClick = jest.fn()
    render(<ActionButton onClick={mockOnClick}>Test</ActionButton>)

    const button = screen.getByRole('button', { name: 'Test' })
    button.click()

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<ActionButton disabled>Disabled</ActionButton>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should render with danger variant styles', () => {
    const { container } = render(<ActionButton variant="danger">Delete</ActionButton>)

    const button = container.querySelector('.bg-red-500')
    expect(button).toBeInTheDocument()
  })

  it('should render with success variant styles', () => {
    const { container } = render(<ActionButton variant="success">Save</ActionButton>)

    const button = container.querySelector('.bg-green-500')
    expect(button).toBeInTheDocument()
  })

  it('should render with outline variant styles', () => {
    const { container } = render(<ActionButton variant="outline">Cancel</ActionButton>)

    const button = container.querySelector('.border-purple-500\\/50')
    expect(button).toBeInTheDocument()
  })
})
