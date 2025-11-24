# AbacatePay Node.js SDK Integration

This document provides a comprehensive guide on how to use the AbacatePay Node.js SDK in your gaming-boost project.

## ✅ Installation Complete

The official AbacatePay SDK has been successfully installed:

```bash
npm install abacatepay-nodejs-sdk
```

**Package Version:** `abacatepay-nodejs-sdk@1.6.0`

## 📁 Updated Files

### 1. [`src/lib/abacatepay.ts`](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/lib/abacatepay.ts)

This file has been migrated from manual `fetch` API calls to use the official SDK.

**Key Changes:**
- ✅ Imported `AbacatePay` from `abacatepay-nodejs-sdk`
- ✅ Updated to use SDK's `billing.create()` method
- ✅ Proper error handling for SDK responses (checks `response.error`)
- ✅ Updated TypeScript interfaces to match SDK's `IBilling` type
- ✅ Fixed status type to include all possible values: `PENDING`, `EXPIRED`, `CANCELLED`, `PAID`, `REFUNDED`

## 🚀 Usage Example

The SDK is already integrated into your `createAbacatePayCharge` function. Here's how it works:

```typescript
import { createAbacatePayCharge } from '@/lib/abacatepay'

// Create a PIX payment
const billing = await createAbacatePayCharge({
  amount: 5000, // R$ 50.00 in cents
  description: 'Pro Game Boost Service',
  customer: {
    name: 'João Silva',
    email: 'joao@example.com',
    taxId: '12345678900', // CPF
    cellphone: '+5511999999999'
  },
  returnUrl: 'https://yoursite.com/payment/return',
  completionUrl: 'https://yoursite.com/payment/success'
})

// Response contains:
console.log(billing.id)        // 'bill_xxxxx'
console.log(billing.url)       // Payment URL for customer
console.log(billing.status)    // 'PENDING'
console.log(billing.devMode)   // true/false
```

## 🔧 SDK Features Available

The AbacatePay SDK provides the following modules:

### Billing Management
```typescript
const abacate = AbacatePay(apiKey)

// Create a billing
await abacate.billing.create(billingData)

// Create a payment link (without customer data)
await abacate.billing.createLink(linkData)

// List all billings
await abacate.billing.list()
```

### Customer Management
```typescript
// Create a customer
await abacate.customer.create({
  name: 'João da Silva',
  cellphone: '11999999999',
  email: 'joao@example.com',
  taxId: '12345678900'
})

// List all customers
await abacate.customer.list()
```

### PIX QR Code
```typescript
// Create a PIX QR Code
await abacate.pixQrCode.create({
  amount: 1000, // R$ 10.00
  description: 'Payment description',
  expiresIn: 3600 // 1 hour
})

// Check payment status
await abacate.pixQrCode.check({ id: 'pix_char_xxxxx' })

// Simulate payment (dev mode only)
await abacate.pixQrCode.simulatePayment({ id: 'pix_char_xxxxx' })
```

### Coupon Management
```typescript
// Create a coupon
await abacate.coupon.create({
  code: 'DESCONTO10',
  discountKind: 'PERCENTAGE',
  discount: 10,
  maxRedeems: 100,
  notes: 'Desconto de 10%'
})

// List all coupons
await abacate.coupon.list()
```

### Withdrawal Management
```typescript
// Create a withdrawal
await abacate.withdrawal.create({
  amount: 10000, // R$ 100.00
  bankAccount: {
    bankCode: '001',
    agency: '1234',
    account: '12345678',
    accountType: 'CHECKING',
    holderName: 'João da Silva',
    holderDocument: '12345678900'
  }
})

// Get withdrawal details
await abacate.withdrawal.get('withdrawal_xxxxx')

// List all withdrawals
await abacate.withdrawal.list()
```

### Store Information
```typescript
// Get store details
await abacate.store.get()
```

## 🔑 Environment Variables

Make sure you have your API key configured:

```env
ABACATEPAY_API_KEY=your_api_key_here
```

## 📊 Response Types

### Successful Response
When a billing is created successfully, you'll receive:

```typescript
{
  id: 'bill_xxxxx',
  url: 'https://abacatepay.com/pay/bill_xxxxx',
  amount: 5000,
  status: 'PENDING',
  devMode: true,
  methods: ['PIX'],
  frequency: 'ONE_TIME',
  nextBilling: null,
  customer: {
    id: 'cust_xxxxx',
    metadata: {
      email: 'customer@example.com'
    }
  },
  createdAt: '2024-11-23T18:38:28.573Z',
  updatedAt: '2024-11-23T18:38:28.573Z'
}
```

### Error Response
The SDK uses a union type for responses:

```typescript
type CreateBillingResponse =
  | { error: null; data: IBilling }
  | { error: string; data: null }
```

Our implementation automatically handles this and throws an error if `response.error` is present.

## 🎯 Payment Status Values

- **`PENDING`** - Payment created, waiting for customer to pay
- **`PAID`** - Payment successfully completed
- **`CANCELLED`** - Payment was cancelled
- **`EXPIRED`** - Payment link has expired
- **`REFUNDED`** - Payment was refunded

## 📚 Additional Resources

- [AbacatePay SDK GitHub](https://github.com/AbacatePay/abacatepay-nodejs-sdk)
- [AbacatePay API Documentation](https://docs.abacatepay.com)
- [Payment Creation Docs](https://docs.abacatepay.com/pages/payment/create)
- [Payment List Docs](https://docs.abacatepay.com/pages/payment/list)

## 🧪 Testing

To test in development mode, the SDK automatically handles dev mode based on your API key type. You can use the `simulatePayment` method for testing:

```typescript
const abacate = AbacatePay(apiKey)

// Simulate a payment in dev mode
await abacate.pixQrCode.simulatePayment({ 
  id: 'pix_char_xxxxx' 
})
```

## ⚠️ Important Notes

1. **Amount in Cents**: Always provide amounts in cents (e.g., 1000 = R$ 10.00)
2. **CPF/CNPJ Required**: The `taxId` field is required for PIX payments
3. **Phone Format**: Use format `+5511999999999` for cellphone
4. **Error Handling**: The SDK returns a union type - always check for `response.error`
5. **Dev Mode**: Use test API keys for development, production keys for live payments

## 🔄 Migration Notes

**Previous Implementation:**
- Used manual `fetch` calls to AbacatePay API
- Custom request/response handling
- Less type safety

**Current Implementation:**
- Official SDK with full TypeScript support
- Better error handling
- Automatic request formatting
- Type-safe responses
- Easier to maintain and update
