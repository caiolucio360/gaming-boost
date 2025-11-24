# Payment During Checkout - Quick Guide

This guide shows how to collect phone and CPF during payment **without saving** the data.

## ✅ Implementation Complete

### Files Created/Updated

1. **[Payment API Route](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/api/payment/pix/route.ts)** ✅
   - Updated to accept `phone` and `taxId` in request body
   - Validates data before creating payment
   - Does NOT save to user database

2. **[Payment Form Component](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/components/payment/payment-form.tsx)** ✅
   - Collects phone and CPF from user
   - Auto-formats while typing
   - Validates before submission
   - Privacy notice included

3. **[Payment Page](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/payment/page.tsx)** ✅
   - Complete payment flow UI
   - Shows form, then payment URL
   - Error handling included

4. **[Validation Utilities](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/lib/validation.ts)** ✅
   - CPF validation with checksum
   - Phone validation
   - Auto-formatting functions

## 🚀 How to Use

### Step 1: Create an Order

```typescript
// In your checkout/order creation flow
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceId: 1,
    currentRank: '10K',
    targetRank: '15K'
  })
})

const { order } = await response.json()
```

### Step 2: Redirect to Payment Page

```typescript
// Redirect user to payment page with order info
router.push(`/payment?orderId=${order.id}&total=${order.total}`)
```

### Step 3: User Fills Payment Form

The user will see a form asking for:
- **Phone**: `(11) 99999-9999` (auto-formatted)
- **CPF**: `000.000.000-00` (auto-formatted)

Both fields are validated in real-time.

### Step 4: Payment is Generated

After clicking "GERAR CÓDIGO PIX", the API:
1. Validates phone and CPF
2. Creates payment with AbacatePay
3. Returns payment URL
4. Saves payment record (without phone/CPF)

### Step 5: User Pays

The page displays a button to open the AbacatePay payment page where the user can:
- View QR Code
- Copy PIX code
- Complete payment

## 🔐 Privacy Features

✅ **Phone and CPF are NOT saved to the database**
- Only sent to AbacatePay for payment processing
- Not stored in `User` model
- Not stored in `Payment` model
- Used only for the transaction

✅ **User is informed**
- Privacy notice on the form
- Clear message that data won't be stored

## 📝 API Request Format

```typescript
POST /api/payment/pix
{
  "orderId": 123,
  "phone": "+5511999999999",    // Required
  "taxId": "12345678900"        // Required (CPF without formatting)
}
```

## ✨ Features

### Auto-Formatting
- **Phone**: User types `11999999999` → Shows `(11) 99999-9999`
- **CPF**: User types `12345678900` → Shows `123.456.789-00`

### Real-time Validation
- CPF validation with algorithm (checksum)
- Phone number format validation
- Helpful error messages

### User Experience
1. Simple 2-field form
2. Visual feedback while typing
3. Clear error messages
4. One-click payment generation
5. Direct link to payment page

## 🎯 Complete Flow Example

```tsx
// 1. User creates order
const order = await createOrder({ serviceId: 1, ... })

// 2. Redirect to payment
router.push(`/payment?orderId=${order.id}&total=${order.total}`)

// 3. PaymentForm component renders
<PaymentForm
  orderId={123}
  orderTotal={50.00}
  onSuccess={(payment) => {
    // Show payment details
    console.log('Payment URL:', payment.pixCode)
  }}
  onError={(error) => {
    // Show error message
    console.error('Error:', error)
  }}
/>

// 4. User enters:
// Phone: (11) 99999-9999
// CPF: 123.456.789-00

// 5. Click "GERAR CÓDIGO PIX"

// 6. API receives:
{
  orderId: 123,
  phone: "+5511999999999",
  taxId: "12345678900"
}

// 7. AbacatePay creates payment

// 8. User sees payment URL and can pay
```

## 🔄 Integration with Your App

### From Dashboard

```tsx
// In your dashboard order card
<button onClick={() => {
  router.push(`/payment?orderId=${order.id}&total=${order.total}`)
}}>
  Pagar com PIX
</button>
```

### From Cart/Checkout

```tsx
// After creating order
const handleCheckout = async () => {
  const order = await createOrder(cartItems)
  router.push(`/payment?orderId=${order.id}&total=${order.total}`)
}
```

## ⚠️ Important Notes

1. **No Database Changes Required** ✅
   - User schema stays the same
   - No migration needed
   - `phone` and `taxId` remain optional

2. **AbacatePay Requirement**
   - Still needs phone and CPF
   - Collected at payment time
   - Not stored by you

3. **LGPD Compliant**
   - Data minimization
   - Clear purpose
   - No unnecessary storage

4. **Testing**
   - Use valid CPF for testing (e.g., `123.456.789-09`)
   - Use format `(11) 99999-9999` for phone
   - AbacatePay dev mode for testing

## 🧪 Test Data

Valid CPF for testing:
- `123.456.789-09`
- `111.444.777-35`

Phone format:
- `(11) 99999-9999`
- Will be sent as: `+5511999999999`

## 📚 Related Files

- [Payment API Route](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/api/payment/pix/route.ts)
- [Payment Form Component](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/components/payment/payment-form.tsx)
- [Payment Page](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/app/payment/page.tsx)
- [Validation Utils](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/src/lib/validation.ts)
- [AbacatePay SDK Guide](file:///c:/Users/caiol/source/repos/boosT/gaming-boost/docs/ABACATEPAY_SDK_GUIDE.md)

---

**You're all set!** 🎉 The payment system is ready to collect phone/CPF during checkout without saving the data.
