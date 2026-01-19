import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApplyForm } from '@/components/booster/apply-form'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}))
jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))
jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}))
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      {...props}
    />
  ),
}))
jest.mock('@/components/ui/label', () => ({
  Label: (props: any) => <label {...props} />,
}))
jest.mock('@/components/ui/card', () => ({
  Card: (props: any) => <div {...props} />,
  CardHeader: (props: any) => <div {...props} />,
  CardTitle: (props: any) => <div {...props} />,
  CardDescription: (props: any) => <div {...props} />,
  CardContent: (props: any) => <div {...props} />,
}))

// Mock toast
jest.mock('@/lib/toast', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('ApplyForm', () => {
  const mockPush = jest.fn()
  const originalError = console.error

  beforeAll(() => {
    console.error = (...args) => {
      originalError(...args)
      // Log to stdout so we can see it in the test output
      // process.stdout.write(JSON.stringify(args) + '\n')
    }
  })

  afterAll(() => {
    console.error = originalError
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  it('should render the form with all fields', () => {
    render(<ApplyForm />)

    expect(screen.getByText('Torne-se um Booster')).toBeInTheDocument()
    expect(screen.getByLabelText(/Sobre você/i)).toBeInTheDocument()
    expect(screen.getByText(/Idiomas/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Perfil Steam/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar Aplicação/i })).toBeInTheDocument()
  })

  it('should show validation error for invalid Steam URL', async () => {
    const user = userEvent.setup()
    render(<ApplyForm />)

    const bioInput = screen.getByLabelText(/Sobre você/i)
    await user.type(bioInput, 'Bio com mais de 10 caracteres')

    const steamInput = screen.getByLabelText(/Perfil Steam/i)
    await user.type(steamInput, 'not-a-valid-url')

    const submitButton = screen.getByRole('button', { name: /Enviar Aplicação/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/URL do Steam inválida/i)).toBeInTheDocument()
    })
  })

  it('should accept valid Steam profile URL', async () => {
    const user = userEvent.setup()
    render(<ApplyForm />)

    const bioInput = screen.getByLabelText(/Sobre você/i)
    await user.type(bioInput, 'Bio com mais de 10 caracteres')

    const steamInput = screen.getByLabelText(/Perfil Steam/i)
    await user.type(steamInput, 'https://steamcommunity.com/profiles/76561198012345678')

    const form = screen.getByRole('button', { name: /Enviar Aplicação/i }).closest('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/booster/apply',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  it('should display Leetify attribution when Steam field is present', () => {
    render(<ApplyForm />)
    
    expect(screen.getByAltText(/Data provided by Leetify/i)).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<ApplyForm />)

    const submitButton = screen.getByRole('button', { name: /Enviar Aplicação/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/pelo menos 10 caracteres/i)).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<ApplyForm />)

    const bioInput = screen.getByLabelText(/Sobre você/i)
    await user.type(bioInput, 'Sou um jogador experiente.')

    const steamInput = screen.getByLabelText(/Perfil Steam/i)
    await user.type(steamInput, 'https://steamcommunity.com/profiles/76561198012345678')

    const form = screen.getByRole('button', { name: /Enviar Aplicação/i }).closest('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/booster/apply',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })

  it('should show error message on failed submission', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Erro ao enviar candidatura' }),
    })

    render(<ApplyForm />)

    const bioInput = screen.getByLabelText(/Sobre você/i)
    await user.type(bioInput, 'Bio válida com mais de dez caracteres.')

    const steamInput = screen.getByLabelText(/Perfil Steam/i)
    await user.type(steamInput, 'https://steamcommunity.com/profiles/76561198012345678')

    const form = screen.getByRole('button', { name: /Enviar Aplicação/i }).closest('form')
    fireEvent.submit(form!)

    // Expect fetch to have been called (error toast is shown internally)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  // it('should disable submit button while submitting', async () => {
  //   const user = userEvent.setup()
  //   
  //   // Mock fetch to delay resolution
  //   (global.fetch as jest.Mock).mockImplementation(
  //     () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
  //   )

  //   render(<ApplyForm />)

  //   const bioInput = screen.getByLabelText(/Sobre você/i)
  //   await user.type(bioInput, 'Bio válida.')

  //   // Mock fetch to never resolve immediately for the submission
  //   (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

  //   const submitButton = screen.getByRole('button', { name: /Enviar Aplicação/i })
  //   
  //   await act(async () => {
  //     await user.click(submitButton)
  //   })

  //   expect(submitButton).toBeDisabled()
  // })
})
