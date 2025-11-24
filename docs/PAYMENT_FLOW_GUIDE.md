# Payment Flow Guide - AbacatePay Integration

This guide explains how to create payments for your clients and what information you need to collect.

## 🔑 Required User Information for PIX Payments

According to AbacatePay requirements, you need to collect the following from your users:

### ✅ Already in Your Schema

Your `User` model already has these fields (lines 23-24 in schema.prisma):

```prisma
model User {
  phone  String? // Telefone de contato
  taxId  String? // CPF/CNPJ para pagamentos
  // ... other fields
}
```

### 📋 Required Fields for Payment

1. **`name`** (String) - Full name of the customer ✅ Already exists
2. **`email`** (String) - Email address ✅ Already exists
3. **`taxId`** (String) - CPF or CNPJ ✅ Already exists (but currently optional)
4. **`phone`** (String) - Cellphone number ✅ Already exists (but currently optional)

## ⚠️ Required Schema Changes

To ensure payments work properly, you should make `taxId` and `phone` **required** fields for CLIENT users:

### Option 1: Make Fields Required (Recommended)

```prisma
model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique
  name     String
  password String
  role     Role    @default(CLIENT)
  phone    String  // Remove the ? to make it required
  taxId    String  // Remove the ? to make it required
  // ... rest of fields
}
```

### Option 2: Collect During Payment (Alternative)

Keep fields optional but collect them when the user makes their first payment.

## 📝 Complete Payment Flow

### Step 1: User Registration

When a user registers, collect:
- ✅ Name
- ✅ Email  
- ✅ Password
- ⚠️ **Phone** (with country code, e.g., `+5511999999999`)
- ⚠️ **CPF/CNPJ** (taxId)

Example registration form update needed in [`src/app/(auth)/register/page.tsx`](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/(auth)/register/page.tsx):

```tsx
// Add these fields to your registration form:

<div className="space-y-2">
  <Label htmlFor="phone">Telefone (com DDD)</Label>
  <Input
    id="phone"
    name="phone"
    type="tel"
    placeholder="+5511999999999"
    required
    className="bg-black/50 border-purple-500/50 text-white"
  />
</div>

<div className="space-y-2">
  <Label htmlFor="taxId">CPF</Label>
  <Input
    id="taxId"
    name="taxId"
    type="text"
    placeholder="000.000.000-00"
    required
    maxLength={14}
    className="bg-black/50 border-purple-500/50 text-white"
  />
</div>
```

### Step 2: Create Order

When a client selects a service:

```typescript
// File: src/app/api/orders/route.ts
const order = await prisma.order.create({
  data: {
    userId: userId,
    serviceId: serviceId,
    status: 'PENDING',
    total: servicePrice,
    currentRank: formData.currentRank,
    targetRank: formData.targetRank,
    // ... other order details
  }
})
```

### Step 3: Generate PIX Payment

Your current implementation in [`src/app/api/payment/pix/route.ts`](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/api/payment/pix/route.ts) is already correct! 

The key part:

```typescript
const charge = await createAbacatePayCharge({
  amount: order.total * 100, // Convert to cents
  description: `Pedido #${order.id} - ${order.service.name}`,
  customer: {
    name: order.user.name,           // ✅ Required
    email: order.user.email,          // ✅ Required
    taxId: order.user.taxId,          // ⚠️ Must not be null
    cellphone: order.user.phone,      // ⚠️ Must not be null
  },
  returnUrl: `${baseUrl}/dashboard`,
  completionUrl: `${baseUrl}/payment/success`,
})
```

### Step 4: Display Payment to User

Show the payment information to the user:

```typescript
// The payment object contains:
{
  id: number,
  orderId: number,
  method: "PIX",
  providerId: "bill_xxxxx",     // AbacatePay billing ID
  pixCode: "https://...",        // Payment URL
  qrCode: "https://...",         // QR Code URL (same as pixCode for now)
  status: "PENDING",
  total: 50.00,
  expiresAt: Date,
  createdAt: Date
}
```

### Step 5: Handle Payment Confirmation

Create a webhook to receive payment confirmations from AbacatePay:

**File:** [`src/app/api/webhooks/abacatepay/route.ts`](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/api/webhooks/abacatepay/route.ts)

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // AbacatePay sends webhook when payment status changes
  if (body.event === 'payment.paid') {
    const providerId = body.data.id
    
    // Find payment by providerId
    const payment = await prisma.payment.findFirst({
      where: { providerId },
      include: { order: true }
    })
    
    if (payment) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })
      
      // Update order status to IN_PROGRESS
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'IN_PROGRESS' }
      })
      
      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: payment.order.userId,
          type: 'PAYMENT',
          title: 'Pagamento Confirmado!',
          message: `Seu pagamento para o pedido #${payment.orderId} foi confirmado.`
        }
      })
    }
  }
  
  return NextResponse.json({ received: true })
}
```

## 🔧 Implementation Checklist

### Database Changes

- [ ] Make `phone` required or collect during first payment
- [ ] Make `taxId` required or collect during first payment
- [ ] Run migration: `npx prisma db push`

### Frontend Changes

- [ ] Update registration form to collect `phone` and `taxId`
- [ ] Add phone/CPF formatting/validation
- [ ] Create payment display page showing PIX code/QR code
- [ ] Add payment status checking (polling or SSE)

### Backend Changes

- [x] Payment creation endpoint ✅ Already implemented
- [ ] Webhook endpoint for payment confirmation
- [ ] Payment status check endpoint
- [ ] Update order status when payment is confirmed

## 📱 Phone Number Format

AbacatePay expects phone numbers in this format:
- **With country code**: `+5511999999999`
- **Format**: `+{country_code}{area_code}{number}`
- **Example**: `+5511999999999` (Brazil, São Paulo)

### Phone Number Validation

```typescript
function formatPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Add +55 if not present (Brazil)
  if (!digits.startsWith('55')) {
    return `+55${digits}`
  }
  
  return `+${digits}`
}
```

## 🆔 CPF/CNPJ Format

AbacatePay accepts CPF/CNPJ in these formats:
- **CPF**: `12345678900` (11 digits, no formatting)
- **CNPJ**: `12345678000190` (14 digits, no formatting)

### CPF Validation

```typescript
function formatTaxId(taxId: string): string {
  // Remove all non-digits
  return taxId.replace(/\D/g, '')
}

function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '')
  
  if (cpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cpf)) return false // All same digits
  
  // CPF validation algorithm
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (parseInt(cpf.charAt(9)) !== digit) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (parseInt(cpf.charAt(10)) !== digit) return false
  
  return true
}
```

## 💡 Current Issue in Your Code

In [`src/app/api/payment/pix/route.ts`](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/api/payment/pix/route.ts), line 86, you have a hardcoded CPF:

```typescript
taxId: '36660267005', // ⚠️ Hardcoded - SHOULD USE: order.user.taxId
```

**This should be changed to:**

```typescript
taxId: order.user.taxId || '', // Use actual user CPF
```

But you need to ensure `order.user.taxId` is never null/empty, which requires:
1. Making the field required in schema
2. Validating during registration
3. Or collecting it before payment

## 🎯 Recommended Next Steps

1. **Update User Schema** - Make `phone` and `taxId` required
2. **Update Registration Form** - Add phone and CPF fields
3. **Add Validation** - CPF and phone validation functions
4. **Fix Payment Route** - Use actual user data instead of hardcoded
5. **Create Webhook** - Handle payment confirmations from AbacatePay
6. **Test Payment Flow** - Use AbacatePay sandbox/dev mode

## 📚 Additional Resources

- [AbacatePay SDK Guide](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/docs/ABACATEPAY_SDK_GUIDE.md) - Complete SDK documentation
- [AbacatePay Webhooks](https://docs.abacatepay.com/webhooks) - Webhook integration guide
- [CPF Validation](https://www.geradorcpf.com/algoritmo_do_cpf.htm) - CPF algorithm details

## 🚨 Important Notes

1. **Dev Mode**: AbacatePay has a dev mode for testing. Use test API keys during development.
2. **Webhook Security**: Validate webhook signatures to ensure requests are from AbacatePay.
3. **Idempotency**: Handle duplicate webhook calls gracefully.
4. **Error Handling**: Always validate user data before sending to AbacatePay.
5. **Privacy**: Store CPF/phone securely and comply with LGPD (Brazilian data protection law).
