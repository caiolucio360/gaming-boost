import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/common/confirm-dialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    title: 'Confirmar Ação',
    description: 'Tem certeza que deseja continuar?',
    onConfirm: jest.fn(),
  }

  it('should render dialog content when open', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Confirmar Ação')).toBeInTheDocument()
    expect(screen.getByText('Tem certeza que deseja continuar?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConfirmDialog {...defaultProps} />)

    const confirmButton = screen.getByRole('button', { name: 'Confirmar' })
    await user.click(confirmButton)

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should render with custom labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Sim, deletar"
        cancelLabel="Não, manter"
      />
    )

    expect(screen.getByRole('button', { name: 'Sim, deletar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Não, manter' })).toBeInTheDocument()
  })

  it('should render with destructive variant styles', () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" />)

    const confirmButton = screen.getByRole('button', { name: 'Confirmar' })
    expect(confirmButton).toHaveClass('bg-red-500')
  })
})
