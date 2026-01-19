/**
 * Tests for SteamCredentialsForm Component
 * TDD: Red phase - tests created before implementation
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SteamCredentialsForm from '@/components/order/steam-credentials-form'

// Mock fetch
global.fetch = jest.fn()

// Mock toast
jest.mock('@/lib/toast', () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
}))

import { showSuccess, showError } from '@/lib/toast'

describe('SteamCredentialsForm', () => {
    const mockOrderId = 123
    const defaultProps = {
        orderId: mockOrderId,
        onSuccess: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        ;(global.fetch as jest.Mock).mockReset()
    })

    describe('Renderização', () => {
        it('deve renderizar o formulário com todos os campos', () => {
            render(<SteamCredentialsForm {...defaultProps} />)

            expect(screen.getByLabelText(/perfil steam/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/usuário steam/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/senha steam/i)).toBeInTheDocument()
            expect(screen.getByRole('checkbox')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument()
        })

        it('deve exibir texto de consentimento', () => {
            render(<SteamCredentialsForm {...defaultProps} />)

            expect(screen.getByText(/concordo em compartilhar/i)).toBeInTheDocument()
        })

        it('deve ter botão desabilitado quando checkbox não marcado', () => {
            render(<SteamCredentialsForm {...defaultProps} />)

            const submitButton = screen.getByRole('button', { name: /salvar/i })
            expect(submitButton).toBeDisabled()
        })
    })

    describe('Validação', () => {
        it('deve mostrar erro quando URL do Steam é inválida', async () => {
            render(<SteamCredentialsForm {...defaultProps} />)

            const urlInput = screen.getByLabelText(/perfil steam/i)
            await userEvent.type(urlInput, 'invalid-url')
            
            const checkbox = screen.getByRole('checkbox')
            await userEvent.click(checkbox)

            const submitButton = screen.getByRole('button', { name: /salvar/i })
            await userEvent.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/url inválida/i)).toBeInTheDocument()
            })
        })

        it('deve aceitar URL válida do Steam', async () => {
            render(<SteamCredentialsForm {...defaultProps} />)

            const urlInput = screen.getByLabelText(/perfil steam/i)
            await userEvent.type(urlInput, 'https://steamcommunity.com/id/testuser')

            // Should not show error for valid URL
            expect(screen.queryByText(/url inválida/i)).not.toBeInTheDocument()
        })

        it('deve exigir username e senha', async () => {
            render(<SteamCredentialsForm {...defaultProps} />)

            const urlInput = screen.getByLabelText(/perfil steam/i)
            await userEvent.type(urlInput, 'https://steamcommunity.com/id/test')

            const checkbox = screen.getByRole('checkbox')
            await userEvent.click(checkbox)

            const submitButton = screen.getByRole('button', { name: /salvar/i })
            await userEvent.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/usuário é obrigatório/i)).toBeInTheDocument()
            })
        })
    })

    describe('Submissão', () => {
        it('deve enviar dados corretamente para a API', async () => {
            ;(global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Credenciais salvas' }),
            })

            render(<SteamCredentialsForm {...defaultProps} />)

            await userEvent.type(
                screen.getByLabelText(/perfil steam/i),
                'https://steamcommunity.com/id/testuser'
            )
            await userEvent.type(screen.getByLabelText(/usuário steam/i), 'mysteamuser')
            await userEvent.type(screen.getByLabelText(/senha steam/i), 'mypassword123')
            await userEvent.click(screen.getByRole('checkbox'))
            await userEvent.click(screen.getByRole('button', { name: /salvar/i }))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    `/api/orders/${mockOrderId}/steam-credentials`,
                    expect.objectContaining({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    })
                )
            })
        })

        it('deve chamar onSuccess após salvar com sucesso', async () => {
            ;(global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Credenciais salvas' }),
            })

            render(<SteamCredentialsForm {...defaultProps} />)

            await userEvent.type(
                screen.getByLabelText(/perfil steam/i),
                'https://steamcommunity.com/id/testuser'
            )
            await userEvent.type(screen.getByLabelText(/usuário steam/i), 'mysteamuser')
            await userEvent.type(screen.getByLabelText(/senha steam/i), 'mypassword123')
            await userEvent.click(screen.getByRole('checkbox'))
            await userEvent.click(screen.getByRole('button', { name: /salvar/i }))

            await waitFor(() => {
                expect(showSuccess).toHaveBeenCalled()
                expect(defaultProps.onSuccess).toHaveBeenCalled()
            })
        })

        it('deve mostrar erro quando API falha', async () => {
            ;(global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'Erro ao salvar' }),
            })

            render(<SteamCredentialsForm {...defaultProps} />)

            await userEvent.type(
                screen.getByLabelText(/perfil steam/i),
                'https://steamcommunity.com/id/testuser'
            )
            await userEvent.type(screen.getByLabelText(/usuário steam/i), 'mysteamuser')
            await userEvent.type(screen.getByLabelText(/senha steam/i), 'mypassword123')
            await userEvent.click(screen.getByRole('checkbox'))
            await userEvent.click(screen.getByRole('button', { name: /salvar/i }))

            await waitFor(() => {
                expect(showError).toHaveBeenCalled()
            })
        })
    })

    describe('Segurança', () => {
        it('deve ter campo de senha com type password', () => {
            render(<SteamCredentialsForm {...defaultProps} />)

            const passwordInput = screen.getByLabelText(/senha steam/i)
            expect(passwordInput).toHaveAttribute('type', 'password')
        })
    })
})
