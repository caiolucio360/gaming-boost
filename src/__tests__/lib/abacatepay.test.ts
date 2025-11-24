import { createAbacatePayCharge } from '@/lib/abacatepay'

// Mock fetch globalmente
global.fetch = jest.fn()

describe('AbacatePay Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        process.env.ABACATEPAY_API_KEY = 'test-api-key'
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    })

    it('should create a charge successfully', async () => {
        const mockResponse = {
            data: {
                id: 'charge-123',
                amount: 1000,
                pix: {
                    code: 'pix-code-123',
                    qr: 'qr-code-url',
                },
            },
        }

            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            })

        const customer = {
            name: 'Test User',
            email: 'test@example.com',
            taxId: '12345678900',
        }

        const params = {
            amount: 1000,
            description: 'Test Charge',
            customer,
        }

        const result = await createAbacatePayCharge(params)

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.abacatepay.com/v1/billing/create',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-api-key',
                },
                body: expect.stringContaining('Test Charge'),
            })
        )

        expect(result).toEqual(mockResponse)
    })

    it('should throw an error if API key is missing', async () => {
        delete process.env.ABACATEPAY_API_KEY

        await expect(
            createAbacatePayCharge({
                amount: 1000,
                description: 'Test',
                customer: { name: 'Test', email: 'test@test.com' },
            })
        ).rejects.toThrow('ABACATEPAY_API_KEY is not configured')
    })

    it('should throw an error if API request fails', async () => {
        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            text: async () => 'API Error',
            statusText: 'Internal Server Error',
        })

        await expect(
            createAbacatePayCharge({
                amount: 1000,
                description: 'Test',
                customer: { name: 'Test', email: 'test@test.com' },
            })
        ).rejects.toThrow('Failed to create charge: Internal Server Error')
    })
})
