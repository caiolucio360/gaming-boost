/**
 * @jest-environment node
 */

import { POST } from '@/app/api/webhooks/abacatepay/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock prisma
jest.mock('@/lib/db', () => ({
    prisma: {
        payment: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        order: {
            update: jest.fn(),
        },
        notification: {
            create: jest.fn(),
        },
        withdrawal: {
            updateMany: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback({
            payment: { update: jest.fn() },
            order: { update: jest.fn() },
            notification: { create: jest.fn() },
        })),
    },
}))

describe('POST /api/webhooks/abacatepay', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Reset NODE_ENV for tests
        process.env.NODE_ENV = 'test'
    })

    describe('Validação de entrada', () => {
        it('deve retornar erro 400 para JSON inválido', async () => {
            const request = new NextRequest('http://localhost/api/webhooks/abacatepay', {
                method: 'POST',
                body: 'invalid json{',
                headers: { 'Content-Type': 'application/json' },
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBe('Invalid JSON')
        })

        it('deve aceitar webhook sem assinatura em ambiente de teste', async () => {
            const request = new NextRequest('http://localhost/api/webhooks/abacatepay', {
                method: 'POST',
                body: JSON.stringify({ event: 'unknown', data: {} }),
                headers: { 'Content-Type': 'application/json' },
            })

            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    describe('billing.paid event', () => {
        it('deve processar pagamento confirmado com sucesso', async () => {
            const mockPayment = {
                id: 1,
                providerId: 'pix_123',
                status: 'PENDING',
                order: { id: 1, status: 'PENDING', userId: 1 },
            }

                ; (prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)

            const request = new NextRequest('http://localhost/api/webhooks/abacatepay', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'billing.paid',
                    data: {
                        pixQrCode: { id: 'pix_123', status: 'PAID' },
                    },
                }),
                headers: { 'Content-Type': 'application/json' },
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.received).toBe(true)
            expect(data.processed).toBe(true)
            expect(data.message).toBe('Pagamento confirmado')
        })

        it('deve retornar idempotente se pagamento já foi processado', async () => {
            const mockPayment = {
                id: 1,
                providerId: 'pix_123',
                status: 'PAID', // Already paid
                order: { id: 1, status: 'PAID', userId: 1 },
            }

                ; (prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)

            const request = new NextRequest('http://localhost/api/webhooks/abacatepay', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'billing.paid',
                    data: {
                        pixQrCode: { id: 'pix_123', status: 'PAID' },
                    },
                }),
                headers: { 'Content-Type': 'application/json' },
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.message).toBe('Já processado')
        })

        it('deve retornar erro quando pagamento não encontrado', async () => {
            ; (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null)
                ; (prisma.payment.findMany as jest.Mock).mockResolvedValue([])

            const request = new NextRequest('http://localhost/api/webhooks/abacatepay', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'billing.paid',
                    data: {
                        pixQrCode: { id: 'pix_not_found', status: 'PAID' },
                    },
                }),
                headers: { 'Content-Type': 'application/json' },
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(500) // Service returns failure when payment not found
            expect(data.processed).toBe(false)
            expect(data.error).toBe('Pagamento não encontrado')
        })
    })

    describe('withdraw.done event', () => {
        it('deve processar saque concluído com sucesso', async () => {
            ; (prisma.withdrawal.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

            const request = new NextRequest('http://localhost/api/webhooks/abacatepay', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'withdraw.done',
                    data: {
                        transaction: { id: 'withdraw_123', externalId: 'ext_123' },
                    },
                }),
                headers: { 'Content-Type': 'application/json' },
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.processed).toBe(true)
            expect(data.message).toBe('Saque concluído')
        })

        it('deve retornar erro quando saque não encontrado', async () => {
            ; (prisma.withdrawal.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

            const request = new NextRequest('http://localhost/api/webhooks/abacatepay', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'withdraw.done',
                    data: {
                        transaction: { id: 'withdraw_notfound' },
                    },
                }),
                headers: { 'Content-Type': 'application/json' },
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.processed).toBe(false)
        })
    })

    describe('withdraw.failed event', () => {
        it('deve processar falha de saque', async () => {
            ; (prisma.withdrawal.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

            const request = new NextRequest('http://localhost/api/webhooks/abacatepay', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'withdraw.failed',
                    data: {
                        transaction: { id: 'withdraw_456' },
                    },
                }),
                headers: { 'Content-Type': 'application/json' },
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.processed).toBe(true)
            expect(data.message).toBe('Saque falhou')
        })
    })
})
