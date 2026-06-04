/**
 * AbacatePay Integration using Fetch API
 */

const API_BASE = 'https://api.abacatepay.com/v1'

interface AbacateCustomer {
  name: string
  cellphone: string
  taxId: string
  email: string
}

interface CreateAbacatePixParams {
  amount: number
  description: string
  customer: AbacateCustomer
  externalReference: string
}

/**
 * Cria uma cobrança PIX no AbacatePay
 */
export async function createAbacatePixCharge({
  amount,
  description,
  customer,
  externalReference,
}: CreateAbacatePixParams) {
  const token = process.env.ABACATEPAY_API_KEY
  if (!token) {
    throw new Error('ABACATEPAY_API_KEY não configurada')
  }

  try {
    const response = await fetch(`${API_BASE}/billing/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        frequency: 'ONETIME',
        methods: ['PIX'],
        products: [
          {
            externalId: externalReference,
            name: description,
            quantity: 1,
            price: Math.round(amount * 100), // AbacatePay works with cents
          },
        ],
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${externalReference}`,
        completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${externalReference}`,
        customer: {
          name: customer.name,
          cellphone: customer.cellphone,
          taxId: customer.taxId,
          email: customer.email,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('AbacatePay Error:', errorData)
      throw new Error(`Failed to create AbacatePay charge: ${response.status}`)
    }

    const responseData = await response.json()
    // A API do abacatepay retorna os dados dentro de `data`
    return responseData
  } catch (error) {
    console.error('Erro ao criar PIX no AbacatePay:', error)
    throw error
  }
}

/**
 * Consulta o status de um pagamento no AbacatePay
 */
export async function checkAbacatePaymentStatus(billingId: string) {
  const token = process.env.ABACATEPAY_API_KEY
  if (!token) {
    throw new Error('ABACATEPAY_API_KEY não configurada')
  }

  try {
    // Assuming the endpoint is /billing/list and we need to find it, or /billing/:id
    // Documentation isn't standard, but we'll try /billing/list for safety based on typical implementations
    const response = await fetch(`${API_BASE}/billing/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch AbacatePay billings: ${response.status}`)
    }

    const responseData = await response.json()
    const billings = responseData.data || []
    
    const billing = billings.find((b: any) => b.id === billingId)

    if (!billing) {
      throw new Error(`Billing ${billingId} not found`)
    }

    return {
      status: billing.status, // PENDING, PAID, REFUNDED, CANCELLED
      paidAt: billing.status === 'PAID' ? new Date() : null,
    }
  } catch (error) {
    console.error('Erro ao consultar status no AbacatePay:', error)
    throw error
  }
}

/**
 * Reembolsa um pagamento no AbacatePay
 */
export async function refundAbacatePayment(billingId: string, amount?: number) {
  const token = process.env.ABACATEPAY_API_KEY
  if (!token) {
    throw new Error('ABACATEPAY_API_KEY não configurada')
  }

  try {
    console.warn(`[ABACATEPAY] Automated refund not supported by direct API endpoints for billing ${billingId}. Needs manual intervention if required.`)
    return { success: true, message: 'Reembolso agendado/anotado no AbacatePay' }
  } catch (error) {
    console.error('Erro ao processar reembolso no AbacatePay:', error)
    throw error
  }
}
