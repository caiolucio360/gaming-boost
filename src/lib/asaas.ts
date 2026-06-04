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

const getBaseUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3'
}

const getHeaders = () => {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY is not configured')
  }
  return {
    'Content-Type': 'application/json',
    'access_token': apiKey
  }
}

/**
 * Ensures a customer exists in Asaas and returns their ID
 */
export async function getOrCreateAsaasCustomer(data: { name: string, email: string, cpfCnpj: string, phone?: string }): Promise<string> {
  // First try to find by CPF/CNPJ
  const searchRes = await fetch(`${getBaseUrl()}/customers?cpfCnpj=${data.cpfCnpj}`, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!searchRes.ok) throw new Error('Failed to search Asaas customer')
  
  const searchData = await searchRes.json()
  
  if (searchData.data && searchData.data.length > 0) {
    return searchData.data[0].id
  }

  // If not found, create new
  const createRes = await fetch(`${getBaseUrl()}/customers`, {
    method: 'POST',
    headers: getHeaders(),
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

/**
 * Creates a PIX charge in Asaas and retrieves the QR Code
 */
export async function createAsaasPixCharge(params: {
  amount: number; // in Reais (R$)
  description: string;
  customer: { name: string; email: string; cpfCnpj: string; phone?: string };
  externalReference?: string;
  dueDate?: Date;
}): Promise<AsaasPixResponse> {
  
  // 1. Get or Create Customer
  const customerId = await getOrCreateAsaasCustomer(params.customer)

  // 2. Create Payment (Charge)
  const dueDateStr = params.dueDate 
    ? params.dueDate.toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0]

  const paymentRes = await fetch(`${getBaseUrl()}/payments`, {
    method: 'POST',
    headers: getHeaders(),
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

  // 3. Get PIX QR Code for this payment
  const qrRes = await fetch(`${getBaseUrl()}/payments/${paymentData.id}/pixQrCode`, {
    method: 'GET',
    headers: getHeaders()
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

/**
 * Creates a PIX Transfer (Payout) to a third party (e.g., Booster)
 */
export async function createAsaasPixTransfer(params: {
  amount: number; // in Reais (R$)
  pixAddressKey: string;
  pixAddressKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
  description?: string;
}): Promise<any> {
  const transferRes = await fetch(`${getBaseUrl()}/transfers`, {
    method: 'POST',
    headers: getHeaders(),
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
 * Refunds a PIX payment in Asaas
 */
export async function refundAsaasPayment(paymentId: string): Promise<any> {
  const refundRes = await fetch(`${getBaseUrl()}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: getHeaders()
  })

  if (!refundRes.ok) {
    const err = await refundRes.json()
    throw new Error(`Failed to refund Asaas payment: ${JSON.stringify(err)}`)
  }

  return await refundRes.json()
}

/**
 * Checks the status of a PIX payment in Asaas
 */
export async function checkAsaasPaymentStatus(paymentId: string): Promise<string> {
  const statusRes = await fetch(`${getBaseUrl()}/payments/${paymentId}`, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!statusRes.ok) {
    const err = await statusRes.json()
    throw new Error(`Failed to check Asaas payment status: ${JSON.stringify(err)}`)
  }

  const data = await statusRes.json()
  return data.status // e.g. 'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE'
}
