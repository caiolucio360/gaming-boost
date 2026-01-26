# Browser Testing Guide for P1 Features

This guide provides step-by-step instructions for testing P1 features directly in your browser.

## Prerequisites

1. Development server running: `npm run dev`
2. Browser open at http://localhost:3000
3. Browser DevTools open (F12)

---

## Test Sequence

### 🔐 Test 1: Create Test User Account

**Objective:** Register a new test user to use throughout testing

**Steps:**
1. Navigate to http://localhost:3000/register
2. Fill in registration form:
   - Name: Test User
   - Email: test.user@example.com
   - Password: password123
3. Click "Criar Conta"

**✅ Success Criteria:**
- Redirected to /dashboard
- Welcome toast notification appears
- User is logged in

**🔧 Troubleshooting:**
- If email already exists, use test.user2@example.com
- Check browser console for errors
- Verify database is running: `npm run db:studio`

---

### 📄 Test 2: Legal Pages

#### 2a. Terms of Service

**Steps:**
1. Navigate to http://localhost:3000/terms
2. Scroll through entire page
3. Verify content is readable

**✅ Success Criteria:**
- Page loads without errors
- 16 sections visible
- Professional legal language
- Mentions "18 anos de idade"
- Brazilian law references present

#### 2b. Privacy Policy

**Steps:**
1. Navigate to http://localhost:3000/privacy
2. Scroll through entire page
3. Look for LGPD compliance

**✅ Success Criteria:**
- Page loads without errors
- 14 sections visible
- "Lei nº 13.709/2018" (LGPD) explicitly mentioned
- DPO contact information present
- Data retention periods specified

#### 2c. Footer Links

**Steps:**
1. Go to homepage: http://localhost:3000
2. Scroll to footer
3. Click "Termos de Uso"
4. Go back, click "Política de Privacidade"

**✅ Success Criteria:**
- Links navigate correctly
- Pages load properly
- Hover effects work (purple text)

---

### 🚦 Test 3: Rate Limiting (Browser Console)

**Objective:** Verify rate limiting prevents abuse

**Open Browser Console (F12) and run:**

```javascript
// Test 1: Login rate limit (5 attempts)
async function testLoginRateLimit() {
  console.log('🚦 Testing login rate limit...')

  for (let i = 1; i <= 6; i++) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword'
      })
    })

    const status = response.status
    const data = await response.json()

    console.log(`Attempt ${i}: HTTP ${status}`, data)

    if (i === 6 && status === 429) {
      console.log('✅ Rate limiting working! Got 429 on 6th attempt')
    } else if (i < 6 && status === 401) {
      console.log(`✅ Attempt ${i} correctly rejected with 401`)
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

// Run the test
testLoginRateLimit()
```

**✅ Success Criteria:**
- First 5 attempts: HTTP 401
- 6th attempt: HTTP 429 with rate limit message
- Response includes headers: X-RateLimit-Limit, X-RateLimit-Remaining

---

### 💰 Test 4: Price Calculator with Loading States

**Steps:**
1. Navigate to http://localhost:3000/games/cs2/pricing
2. Open Network tab in DevTools
3. Select "Premier" tab (should be default)
4. Click current rating: 5K
5. Click target rating: 10K
6. Click "CALCULAR PREÇO" button
7. Watch loading states

**✅ Success Criteria:**
- Button shows spinner immediately
- Button text changes to "Calculando..."
- Button becomes disabled (grayed out)
- Price area shows spinner + "Calculando preço..."
- After < 1 second, price appears (e.g., "R$ 125.00")
- Loading states clear completely
- "CONTRATAR AGORA" button appears in purple

**🔍 Watch for:**
- No flickering or layout shifts
- Smooth transitions
- Mobile responsive (resize browser window)

---

### ⚠️ Test 5: Order Duplication Prevention

#### 5a. Without Active Orders (Normal Flow)

**Steps:**
1. Ensure you have NO active orders (check /dashboard)
2. Navigate to http://localhost:3000/games/cs2/pricing
3. Select Premier mode
4. Calculate price
5. Look for warnings

**✅ Success Criteria:**
- NO yellow warning banner
- "CONTRATAR AGORA" button is purple and enabled
- Can proceed normally

#### 5b. With Active Order (Warning Should Appear)

**Setup:**
1. Create an order (don't complete payment):
   - Go to pricing page
   - Calculate price for Premier 5K → 10K
   - Click "CONTRATAR AGORA"
   - This creates a PENDING order

**Steps:**
1. Go back to http://localhost:3000/games/cs2/pricing
2. Select Premier mode
3. Calculate price
4. Observe warnings

**✅ Success Criteria:**
- Yellow/orange warning banner appears with pulse animation
- Banner shows: "Você já possui um boost ativo nesta modalidade"
- Shows order status: "1 pedido pendente"
- "Ver Meus Pedidos" button links to /dashboard
- "CONTRATAR AGORA" button is gray and disabled
- Button text: "BOOST JÁ ATIVO NESTA MODALIDADE"
- Helper text: "Finalize seu pedido atual para contratar um novo"

#### 5c. Different Mode (No Warning)

**Steps:**
1. With Premier order still PENDING
2. Go to pricing page
3. Click "Gamers Club" tab
4. Calculate price

**✅ Success Criteria:**
- Warning banner disappears
- "CONTRATAR AGORA" button enabled (purple)
- Can create order in different mode

#### 5d. Mode Switching

**Steps:**
1. Start on Premier tab (with PENDING order)
2. Switch to Gamers Club tab
3. Switch back to Premier tab

**✅ Success Criteria:**
- Warning appears on Premier
- Warning disappears on Gamers Club
- Warning reappears when switching back to Premier
- No flickering or errors

---

### 🔄 Test 6: Order Cancellation & Refund

#### 6a. Cancel PENDING Order

**Setup:**
- Have a PENDING order (no payment made)

**Steps:**
1. Navigate to http://localhost:3000/dashboard
2. Find PENDING order
3. Click "Cancelar" button
4. Read confirmation dialog
5. Confirm cancellation

**✅ Success Criteria:**
- Dialog appears with message: "Esta ação não pode ser desfeita."
- After confirming, order disappears or shows CANCELLED
- Success toast notification
- Page refreshes/updates automatically
- Check email for cancellation notification (if configured)

#### 6b. Cancel PAID Order (Refund)

**Setup:**
1. Create order
2. Complete PIX payment
3. Wait for order status → PAID

**Steps:**
1. Go to /dashboard
2. Find PAID order
3. Click "Cancelar e Solicitar Reembolso"
4. Read confirmation dialog
5. Confirm cancellation

**✅ Success Criteria:**
- Dialog shows: "O pagamento será reembolsado..."
- Order status → CANCELLED
- Payment status → REFUNDED
- Success message mentions refund
- Check email for refund confirmation

**🔧 Note:**
- Refund processing may take a few seconds (synchronous)
- If refund fails, cancellation should be blocked

#### 6c. Cannot Cancel IN_PROGRESS Order

**Setup:**
- Have a booster accept your order (status → IN_PROGRESS)

**Steps:**
1. Go to /dashboard
2. Find IN_PROGRESS order
3. Look for cancel button

**✅ Success Criteria:**
- No "Cancelar" button visible
- Only options: View details, Open dispute

---

### 🇧🇷 Test 7: Portuguese Error Messages

**Objective:** Verify all error messages are in Portuguese

**Test Cases:**

#### 7a. Invalid Login
**Steps:**
1. Logout if logged in
2. Try to login with wrong password

**✅ Expected:**
- "Email ou senha incorretos" (NOT "Invalid credentials")

#### 7b. Invalid Price Calculation
**Open Console and run:**
```javascript
fetch('/api/pricing/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    game: 'CS2',
    gameMode: 'PREMIER',
    current: 15000,
    target: 10000
  })
}).then(r => r.json()).then(console.log)
```

**✅ Expected:**
- Error message: "A pontuação atual deve ser menor que a pontuação desejada"
- NOT "current must be less than target"

#### 7c. Missing Fields
**Run in console:**
```javascript
fetch('/api/pricing/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ game: 'CS2' })
}).then(r => r.json()).then(console.log)
```

**✅ Expected:**
- Error: "Campos obrigatórios ausentes: jogo, modo, pontuação atual e desejada"
- NOT "Missing required fields"

---

### 🗑️ Test 8: Admin Service CRUD Removed

**Objective:** Verify service management UI is removed

**Steps:**
1. Login as admin (if you have admin account)
2. Navigate to http://localhost:3000/admin
3. Look for service management

**✅ Success Criteria:**
- Dashboard has 3 stat cards (Users, Orders, Revenue)
- NO "Serviços Disponíveis" card
- NO "Gerenciar Serviços" quick action button
- Grid uses 3 columns, not 4

**Also test:**
- Direct URL: http://localhost:3000/admin/services → 404
- API: http://localhost:3000/api/admin/services → 404

---

## Complete User Journey Test

**Objective:** Test entire flow from registration to cancellation

**Timeline:** ~10 minutes

**Steps:**
1. ✅ Register new account
2. ✅ Browse to CS2 pricing page
3. ✅ Select Premier mode
4. ✅ Calculate price (5K → 10K)
5. ✅ Click "CONTRATAR AGORA"
6. ✅ Verify added to cart
7. ✅ Go to cart page
8. ✅ Proceed to payment (generates PIX)
9. ✅ Check dashboard for PENDING/PAID order
10. ✅ Try to create duplicate order (should be blocked)
11. ✅ Cancel order from dashboard
12. ✅ Verify cancellation successful
13. ✅ Verify can create new order now

**🎯 All steps should complete without errors!**

---

## Mobile Responsive Testing

**Device Sizes to Test:**
- 📱 Mobile: 375px width
- 📱 Tablet: 768px width
- 💻 Desktop: 1920px width

**How to Test:**
1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select device or set custom width
4. Test all P1 features at each size

**✅ Check:**
- No horizontal scrolling
- Buttons are tappable (not too small)
- Text is readable
- Warning banners fit properly
- Calculator buttons arranged correctly
- Loading states visible

---

## Performance Check

**Run in Console:**
```javascript
// Measure price calculation time
async function measurePriceCalc() {
  const start = performance.now()

  const response = await fetch('/api/pricing/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game: 'CS2',
      gameMode: 'PREMIER',
      current: 5000,
      target: 10000
    })
  })

  const end = performance.now()
  const data = await response.json()

  console.log(`⏱️ Price calculation took ${(end - start).toFixed(2)}ms`)
  console.log('Price:', data)
}

measurePriceCalc()
```

**✅ Expected:**
- Response time < 500ms
- No errors in console

---

## Final Checklist

Before marking P1 testing complete:

- [ ] All test cases above completed
- [ ] No console errors in browser
- [ ] No network errors in Network tab
- [ ] All loading states work correctly
- [ ] All error messages in Portuguese
- [ ] Rate limiting prevents abuse
- [ ] Mobile responsive on all device sizes
- [ ] Complete user journey successful
- [ ] Legal pages accessible and complete
- [ ] Service CRUD fully removed
- [ ] Order duplication prevented
- [ ] Cancellation and refunds work

---

## Common Issues & Fixes

### Issue: Rate limiting not working
**Fix:** Clear browser cache, restart server

### Issue: Orders not showing in dashboard
**Fix:** Check authentication, verify database connection

### Issue: Warning banner not appearing
**Fix:** Create actual order first, check browser console for errors

### Issue: Price calculator stuck loading
**Fix:** Check /api/pricing/calculate endpoint, verify database has pricing config

### Issue: Cannot cancel order
**Fix:** Verify order status is PENDING or PAID, check API logs

---

## Need Help?

If you encounter issues:
1. Check browser console (F12)
2. Check server logs in terminal
3. Verify database is running: `npm run db:studio`
4. Check [TEST_PLAN.md](TEST_PLAN.md) for detailed test cases
5. Review error messages in [src/lib/api-errors.ts](src/lib/api-errors.ts)
