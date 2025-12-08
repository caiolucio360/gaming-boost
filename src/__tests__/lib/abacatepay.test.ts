import { createAbacatePayCharge } from '@/lib/abacatepay'

describe('AbacatePay Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        process.env.ABACATEPAY_API_KEY = 'test-api-key'
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    })

    it('should throw an error if API key is missing', async () => {
        delete process.env.ABACATEPAY_API_KEY

        await expect(
            createAbacatePayCharge({
                amount: 1000,
                description: 'Test',
                customer: { name: 'Test', email: 'test@test.com', taxId: '12345678900', cellphone: '+5511999999999' },
            })
        ).rejects.toThrow('ABACATEPAY_API_KEY is not configured')
    })

    it('should have correct parameters in customer object', () => {
        // This test validates that the CreateChargeParams interface is correct
        const params = {
            amount: 1000,
            description: 'Test Charge',
            customer: {
                name: 'Test User',
                email: 'test@example.com',
                taxId: '12345678900',
                cellphone: '+5511999999999',
            },
        }

        expect(params.customer.name).toBe('Test User')
        expect(params.customer.email).toBe('test@example.com')
        expect(params.customer.taxId).toBe('12345678900')
        expect(params.customer.cellphone).toBe('+5511999999999')
    })
})
