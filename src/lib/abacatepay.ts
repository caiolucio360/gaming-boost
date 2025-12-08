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

// ====== PIX QR CODE INTERFACES ======

// Resposta do PIX QR Code
export interface PixQrCodeResponse {
    id: string
    amount: number
    status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED'
    devMode: boolean
    brCode: string // Código copia-e-cola
    brCodeBase64: string // Imagem do QR Code em base64
    platformFee: number
    createdAt: string
    updatedAt: string
    expiresAt: string
}

// Params para criar PIX QR Code
export interface CreatePixQrCodeParams {
    amount: number  // Em centavos
    expiresIn?: number  // Segundos para expirar (default: 1800 = 30 min)
    description?: string
    customer?: AbacatePayCustomer
    metadata?: Record<string, string>
}

// Status do PIX
export interface PixStatusResponse {
    status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED'
    expiresAt: string
}

// ====== WITHDRAW INTERFACES ======

export type PixKeyType = 'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'RANDOM' | 'BR_CODE'

export interface CreateWithdrawParams {
    externalId: string
    amount: number  // Mínimo 350 centavos (R$ 3,50)
    pix: {
        type: PixKeyType
        key: string
    }
    description?: string
}

export interface WithdrawResponse {
    id: string
    status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'COMPLETE' | 'REFUNDED'
    devMode: boolean
    receiptUrl: string
    kind: 'WITHDRAW'
    amount: number
    platformFee: number
    createdAt: string
    updatedAt: string
    externalId: string
}

// ====== HELPER FUNCTIONS ======

function getApiKey(): string {
    const apiKey = process.env.ABACATEPAY_API_KEY
    if (!apiKey) {
        throw new Error('ABACATEPAY_API_KEY is not configured')
    }
    return apiKey
}

async function apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>
): Promise<T> {
    const apiKey = getApiKey()
    const baseUrl = 'https://api.abacatepay.com/v1'

    const options: RequestInit = {
        method,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
    }

    if (body && method === 'POST') {
        options.body = JSON.stringify(body)
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options)
    const data = await response.json()

    if (!response.ok || data.error) {
        console.error('AbacatePay API Error:', data)
        throw new Error(data.error || `API Error: ${response.status}`)
    }

    return data.data as T
}

// ====== PIX QR CODE FUNCTIONS ======

/**
 * Cria um QR Code PIX para pagamento
 * @param params - Parâmetros do PIX
 * @returns Dados do PIX incluindo brCode e brCodeBase64
 */
export async function createPixQrCode(params: CreatePixQrCodeParams): Promise<PixQrCodeResponse> {
    console.log('========== CREATING PIX QR CODE ==========')
    console.log('Amount (cents):', params.amount)
    console.log('Description:', params.description)
    console.log('ExpiresIn:', params.expiresIn || 1800, 'seconds')
    console.log('==========================================')

    const body: Record<string, unknown> = {
        amount: params.amount,
        expiresIn: params.expiresIn || 1800, // 30 minutos default
    }

    if (params.description) {
        body.description = params.description
    }

    if (params.customer) {
        body.customer = {
            name: params.customer.name,
            cellphone: params.customer.cellphone,
            email: params.customer.email,
            taxId: params.customer.taxId,
        }
    }

    if (params.metadata) {
        body.metadata = params.metadata
    }

    const result = await apiRequest<PixQrCodeResponse>('/pixQrCode/create', 'POST', body)

    console.log('========== PIX QR CODE CREATED ==========')
    console.log('PIX ID:', result.id)
    console.log('Status:', result.status)
    console.log('Amount:', result.amount)
    console.log('Expires At:', result.expiresAt)
    console.log('BrCode (first 50 chars):', result.brCode?.substring(0, 50) + '...')
    console.log('=========================================')

    return result
}

/**
 * Verifica o status de um pagamento PIX
 * @param pixQrCodeId - ID do PIX QR Code
 * @returns Status atual e data de expiração
 */
export async function checkPixStatus(pixQrCodeId: string): Promise<PixStatusResponse> {
    console.log('Checking PIX status for:', pixQrCodeId)

    const result = await apiRequest<PixStatusResponse>(
        `/pixQrCode/check?id=${encodeURIComponent(pixQrCodeId)}`,
        'GET'
    )

    console.log('PIX Status:', result.status)
    return result
}

/**
 * Simula o pagamento de um PIX (apenas em dev mode)
 * @param pixQrCodeId - ID do PIX QR Code
 * @returns Dados atualizados do PIX
 */
export async function simulatePixPayment(pixQrCodeId: string): Promise<PixQrCodeResponse> {
    console.log('========== SIMULATING PIX PAYMENT ==========')
    console.log('PIX ID:', pixQrCodeId)
    console.log('============================================')

    const result = await apiRequest<PixQrCodeResponse>(
        `/pixQrCode/simulate-payment?id=${encodeURIComponent(pixQrCodeId)}`,
        'POST',
        { metadata: {} }
    )

    console.log('Simulation result - Status:', result.status)
    return result
}

// ====== WITHDRAW FUNCTIONS ======

/**
 * Cria um saque PIX
 * @param params - Parâmetros do saque
 * @returns Dados do saque criado
 */
export async function createWithdrawal(params: CreateWithdrawParams): Promise<WithdrawResponse> {
    console.log('========== CREATING WITHDRAWAL ==========')
    console.log('External ID:', params.externalId)
    console.log('Amount (cents):', params.amount)
    console.log('PIX Key Type:', params.pix.type)
    console.log('PIX Key:', params.pix.key.substring(0, 5) + '...')
    console.log('=========================================')

    if (params.amount < 350) {
        throw new Error('Valor mínimo para saque é R$ 3,50 (350 centavos)')
    }

    const body: Record<string, unknown> = {
        externalId: params.externalId,
        method: 'PIX',
        amount: params.amount,
        pix: {
            type: params.pix.type,
            key: params.pix.key,
        },
    }

    if (params.description) {
        body.description = params.description
    }

    const result = await apiRequest<WithdrawResponse>('/withdraw/create', 'POST', body)

    console.log('========== WITHDRAWAL CREATED ==========')
    console.log('Withdraw ID:', result.id)
    console.log('Status:', result.status)
    console.log('Receipt URL:', result.receiptUrl)
    console.log('========================================')

    return result
}

/**
 * Lista todos os saques
 * @returns Lista de saques
 */
export async function listWithdrawals(): Promise<WithdrawResponse[]> {
    const result = await apiRequest<WithdrawResponse[]>('/withdraw/list', 'GET')
    return result
}

// ====== LEGACY BILLING FUNCTIONS ======

/**
 * Creates a PIX charge using the official AbacatePay SDK
 * @deprecated Use createPixQrCode() instead for internal payment display
 * @param params - Payment parameters
 * @returns AbacatePay billing response
 */
export async function createAbacatePayCharge(params: CreateChargeParams): Promise<AbacatePayResponse> {
    const apiKey = getApiKey()

    // Initialize the AbacatePay SDK with your API key
    const abacate = AbacatePay(apiKey)

    // Convert amount to cents if necessary
    const amountInCents = Math.round(params.amount)

    console.log('========== ABACATEPAY SDK REQUEST ==========')
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...')
    console.log('Amount (cents):', amountInCents)
    console.log('Description:', params.description)
    console.log('Customer:', params.customer)
    console.log('============================================')

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
            console.error('==========================================')
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
        console.log('=============================================')

        return billing
    } catch (error) {
        console.error('========== ABACATEPAY SDK ERROR ==========')
        console.error('Error:', error)
        console.error('==========================================')

        if (error instanceof Error) {
            throw new Error(`AbacatePay SDK Error: ${error.message}`)
        }
        throw new Error('Failed to create charge with AbacatePay SDK')
    }
}

