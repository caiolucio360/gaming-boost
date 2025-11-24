import AbacatePay from 'abacatepay-nodejs-sdk'

// Customer interface for AbacatePay
export interface AbacatePayCustomer {
    name: string
    email: string
    taxId: string // CPF/CNPJ
    cellphone: string
}

// Params for creating a charge
export interface CreateChargeParams {
    amount: number // Em centavos (ex: 1000 = R$ 10,00)
    description: string
    customer: AbacatePayCustomer
    returnUrl?: string
    completionUrl?: string
}

// Response from AbacatePay SDK - matches IBilling type
export interface AbacatePayResponse {
    id: string
    url: string
    amount: number
    status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED'
    devMode: boolean
    methods: string[]
    frequency: string
    nextBilling: string | null
    customer: {
        id: string
        metadata: {
            email: string
        }
    }
    createdAt: string
    updatedAt: string
}

/**
 * Creates a PIX charge using the official AbacatePay SDK
 * @param params - Payment parameters
 * @returns AbacatePay billing response
 */
export async function createAbacatePayCharge(params: CreateChargeParams): Promise<AbacatePayResponse> {
    const apiKey = process.env.ABACATEPAY_API_KEY

    if (!apiKey) {
        throw new Error('ABACATEPAY_API_KEY is not configured')
    }

    // Initialize the AbacatePay SDK with your API key
    const abacate = AbacatePay(apiKey)

    // Convert amount to cents if necessary
    const amountInCents = Math.round(params.amount)

    console.log('========== ABACATEPAY SDK REQUEST ==========')
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...')
    console.log('Amount (cents):', amountInCents)
    console.log('Description:', params.description)
    console.log('Customer:', params.customer)
    console.log('===========================================')

    try {
        // Create a one-time PIX payment using the SDK
        const response = await abacate.billing.create({
            frequency: 'ONE_TIME',
            methods: ['PIX'],
            products: [
                {
                    externalId: 'service-boost',
                    name: params.description,
                    quantity: 1,
                    price: amountInCents,
                }
            ],
            returnUrl: params.returnUrl || 'https://yoursite.com/app',
            completionUrl: params.completionUrl || 'https://yoursite.com/payment/success',
            customer: {
                name: params.customer.name,
                email: params.customer.email,
                cellphone: params.customer.cellphone,
                taxId: params.customer.taxId,
            },
        })

        // Check if the response contains an error
        if (response.error) {
            console.error('========== ABACATEPAY SDK ERROR ==========')
            console.error('Error:', response.error)
            console.error('=========================================')
            throw new Error(`AbacatePay SDK Error: ${response.error}`)
        }

        // Extract billing data from successful response
        const billing = response.data

        if (!billing) {
            throw new Error('AbacatePay SDK returned no data')
        }

        console.log('========== ABACATEPAY SDK RESPONSE ==========')
        console.log('Billing ID:', billing.id)
        console.log('Payment URL:', billing.url)
        console.log('Amount:', billing.amount)
        console.log('Status:', billing.status)
        console.log('Dev Mode:', billing.devMode)
        console.log('===========================================')

        return billing
    } catch (error) {
        console.error('========== ABACATEPAY SDK ERROR ==========')
        console.error('Error:', error)
        console.error('=========================================')

        if (error instanceof Error) {
            throw new Error(`AbacatePay SDK Error: ${error.message}`)
        }
        throw new Error('Failed to create charge with AbacatePay SDK')
    }
}
