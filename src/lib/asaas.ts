/**
 * Asaas Payment Provider Integration
 * Documentação: https://docs.asaas.com/reference/comece-por-aqui
 *
 * Fluxo PIX:
 *   1. Criar customer (getOrCreateAsaasCustomer)
 *   2. Criar cobrança com billingType=PIX (POST /v3/payments)
 *   3. Buscar QR Code (GET /v3/payments/{id}/pixQrCode)
 *   4. Receber webhook PAYMENT_RECEIVED → confirmar pagamento
 *
 * Fluxo Saque (Booster):
 *   1. Criar transferência PIX (POST /v3/transfers)
 *   2. Receber webhook TRANSFER_DONE → marcar saque como concluído
 */

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
}

export interface AsaasPixResponse {
  id: string
  status: string
  encodedImage: string
  payload: string
  expirationDate: string
}

export interface AsaasPaymentDetails {
  id: string
  status: string
  value: number
  netValue: number
  billingType: string
  description: string | null
  externalReference: string | null
  paymentDate: string | null
  confirmedDate: string | null
  invoiceUrl: string | null
  deleted: boolean
}

export interface AsaasTransferDetails {
  id: string
  status: string
  value: number
  netValue: number
  transferFee: number
  operationType: string
  failReason: string | null
  transactionReceiptUrl: string | null
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const getBaseUrl = () => {
  return process.env.NODE_ENV === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://api-sandbox.asaas.com/v3'
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

/**
 * Ensures a customer exists in Asaas and returns their ID.
 * First searches by CPF/CNPJ, creates if not found.
 */
export async function getOrCreateAsaasCustomer(data: { name: string, email: string, cpfCnpj: string, phone?: string }): Promise<string> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY is not configured')
  }

  // First try to find by CPF/CNPJ
  const searchRes = await fetch(`${getBaseUrl()}/customers?cpfCnpj=${data.cpfCnpj}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'access_token': apiKey }
  })

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}))
    throw new Error(`Failed to search Asaas customer: ${JSON.stringify(err)} | Status: ${searchRes.status}`)
  }

  const searchData = await searchRes.json()

  if (searchData.data && searchData.data.length > 0) {
    return searchData.data[0].id
  }

  // If not found, create new
  const createRes = await fetch(`${getBaseUrl()}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj,
      mobilePhone: data.phone,
      notificationDisabled: true
    })
  })

  if (!createRes.ok) {
    const err = await createRes.json()
    throw new Error(`Failed to create Asaas customer: ${JSON.stringify(err)}`)
  }

  const createData = await createRes.json()
  return createData.id
}

// ---------------------------------------------------------------------------
// PIX Charge (Cobrança)
// ---------------------------------------------------------------------------

/**
 * Creates a PIX charge in Asaas and retrieves the QR Code.
 *
 * Flow:
 *   POST /v3/payments  (billingType: PIX)
 *   GET  /v3/payments/{id}/pixQrCode
 *
 * Returns encodedImage (Base64), payload (copia-e-cola), expirationDate.
 */
export async function createAsaasPixCharge(params: {
  amount: number; // in Reais (R$)
  description: string;
  customer: { name: string; email: string; cpfCnpj: string; phone?: string };
  externalReference?: string;
  dueDate?: Date;
}): Promise<AsaasPixResponse> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY is not configured')
  }

  // 1. Get or Create Customer
  const customerId = await getOrCreateAsaasCustomer(params.customer)

  // 2. Create Payment (Charge) — POST /v3/payments
  const dueDateStr = params.dueDate
    ? params.dueDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const paymentRes = await fetch(`${getBaseUrl()}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: params.amount,
      dueDate: dueDateStr,
      description: params.description,
      externalReference: params.externalReference
    })
  })

  if (!paymentRes.ok) {
    const err = await paymentRes.json()
    throw new Error(`Failed to create Asaas payment: ${JSON.stringify(err)}`)
  }

  const paymentData = await paymentRes.json()

  // 3. Get PIX QR Code — GET /v3/payments/{id}/pixQrCode
  const qrRes = await fetch(`${getBaseUrl()}/payments/${paymentData.id}/pixQrCode`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'access_token': apiKey }
  })

  if (!qrRes.ok) {
    const err = await qrRes.json()
    throw new Error(`Failed to get PIX QR Code: ${JSON.stringify(err)}`)
  }

  const qrData = await qrRes.json()

  return {
    id: paymentData.id,
    status: paymentData.status, // Usually 'PENDING'
    encodedImage: qrData.encodedImage, // Base64
    payload: qrData.payload, // Copy and paste text
    expirationDate: qrData.expirationDate
  }
}

// ---------------------------------------------------------------------------
// Payment Queries
// ---------------------------------------------------------------------------

/**
 * Get full payment details from Asaas — GET /v3/payments/{id}
 */
export async function getAsaasPaymentById(paymentId: string): Promise<AsaasPaymentDetails> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY is not configured')
  }

  const res = await fetch(`${getBaseUrl()}/payments/${paymentId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'access_token': apiKey }
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to get Asaas payment: ${JSON.stringify(err)}`)
  }

  return await res.json()
}

/**
 * Check payment status — GET /v3/payments/{id}
 * Returns just the status string (e.g. 'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE')
 */
export async function checkAsaasPaymentStatus(paymentId: string): Promise<string> {
  const data = await getAsaasPaymentById(paymentId)
  return data.status
}

// ---------------------------------------------------------------------------
// Payment Actions (Refund / Cancel)
// ---------------------------------------------------------------------------

/**
 * Refund a PIX payment — POST /v3/payments/{id}/refund
 */
export async function refundAsaasPayment(paymentId: string): Promise<unknown> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY is not configured')
  }

  const refundRes = await fetch(`${getBaseUrl()}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': apiKey }
  })

  if (!refundRes.ok) {
    const err = await refundRes.json()
    throw new Error(`Failed to refund Asaas payment: ${JSON.stringify(err)}`)
  }

  return await refundRes.json()
}

/**
 * Cancel/delete a pending payment — DELETE /v3/payments/{id}
 * Only works for payments that haven't been paid yet.
 */
export async function cancelAsaasPayment(paymentId: string): Promise<unknown> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY is not configured')
  }

  const res = await fetch(`${getBaseUrl()}/payments/${paymentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'access_token': apiKey }
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to cancel Asaas payment: ${JSON.stringify(err)}`)
  }

  return await res.json()
}

// ---------------------------------------------------------------------------
// Transfers (Saques para Boosters)
// ---------------------------------------------------------------------------

/**
 * Create a PIX Transfer (Payout) to a third party (e.g., Booster)
 * POST /v3/transfers
 */
export async function createAsaasPixTransfer(params: {
  amount: number; // in Reais (R$)
  pixAddressKey: string;
  pixAddressKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
  description?: string;
}): Promise<{ id: string; transactionReceiptUrl?: string | null }> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY is not configured')
  }

  const transferRes = await fetch(`${getBaseUrl()}/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
    body: JSON.stringify({
      value: params.amount,
      pixAddressKey: params.pixAddressKey,
      pixAddressKeyType: params.pixAddressKeyType,
      operationType: 'PIX',
      description: params.description
    })
  })

  if (!transferRes.ok) {
    const err = await transferRes.json()
    throw new Error(`Failed to create Asaas transfer: ${JSON.stringify(err)}`)
  }

  return await transferRes.json()
}

/**
 * Get transfer details — GET /v3/transfers/{id}
 */
export async function getAsaasTransferStatus(transferId: string): Promise<AsaasTransferDetails> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY is not configured')
  }

  const res = await fetch(`${getBaseUrl()}/transfers/${transferId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'access_token': apiKey }
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to get Asaas transfer: ${JSON.stringify(err)}`)
  }

  return await res.json()
}
