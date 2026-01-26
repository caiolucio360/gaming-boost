# P1 Features Testing Plan

## Test Environment Setup

### 1. Start Development Server
```bash
npm run dev
```
Server should start at http://localhost:3000

### 2. Verify Database Connection
```bash
npm run db:studio
```
Prisma Studio should open at http://localhost:5555

### 3. Seed Test Data (if needed)
```bash
npm run db:seed
```

---

## Test Session Checklist

### ✅ P0 #4: Rate Limiting on Critical Endpoints

#### Test 1: Login Rate Limit (5 attempts per 15 min)
**Steps:**
1. Open Postman/Insomnia/curl
2. Send 6 login requests with wrong password:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass"}' \
  -i
```

**Expected Results:**
- [ ] First 5 requests: 401 Unauthorized
- [ ] 6th request: 429 Too Many Requests
- [ ] Response headers include: `X-RateLimit-Limit: 5`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset: <timestamp>`
- [ ] Error message: "Muitas tentativas de login. Tente novamente mais tarde."

#### Test 2: Registration Rate Limit (3 attempts per 15 min)
**Steps:**
1. Send 4 registration requests:
```bash
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}" \
    -i
  echo "\n---Attempt $i---\n"
  sleep 1
done
```

**Expected Results:**
- [ ] First 3 requests: 201 Created or 400 Bad Request (normal responses)
- [ ] 4th request: 429 Too Many Requests
- [ ] Error message: "Muitas tentativas de registro. Tente novamente mais tarde."

#### Test 3: Payment PIX Rate Limit (5 attempts per min - strict)
**Steps:**
1. Log in as a client
2. Create an order
3. Try to generate PIX 6 times rapidly

**Expected Results:**
- [ ] First 5 requests: 201 Created or normal error
- [ ] 6th request: 429 Too Many Requests
- [ ] Error message: "Muitas tentativas de pagamento. Aguarde um momento."

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### ✅ P1 #6: Terms of Service & Privacy Policy Pages

#### Test 1: Terms of Service Page
**Steps:**
1. Navigate to http://localhost:3000/terms
2. Scroll through entire page
3. Check mobile view (resize browser or use DevTools)

**Expected Results:**
- [ ] Page loads without errors
- [ ] All 16 sections are visible
- [ ] Legal language is clear and professional
- [ ] Sections include: Definições, Elegibilidade, Pagamentos, Reembolsos, Comissões, Disputas
- [ ] Footer mentions: "Lei nº 8.078/90" (Código de Defesa do Consumidor)
- [ ] Age requirement: 18+ mentioned
- [ ] Mobile responsive layout works

#### Test 2: Privacy Policy Page
**Steps:**
1. Navigate to http://localhost:3000/privacy
2. Scroll through entire page
3. Verify LGPD compliance statements

**Expected Results:**
- [ ] Page loads without errors
- [ ] All 14 sections are visible
- [ ] LGPD (Lei nº 13.709/2018) explicitly mentioned
- [ ] DPO contact information present
- [ ] User rights section includes: access, correction, deletion, portability
- [ ] Data retention periods specified (5 years for financial data)
- [ ] Security measures mentioned (AES-256-GCM, bcrypt, rate limiting)
- [ ] Mobile responsive layout works

#### Test 3: Footer Links
**Steps:**
1. Navigate to homepage or any page
2. Scroll to footer
3. Click "Termos de Uso" link
4. Click "Política de Privacidade" link

**Expected Results:**
- [ ] "Termos de Uso" link navigates to /terms
- [ ] "Política de Privacidade" link navigates to /privacy
- [ ] Links open in same tab (not new tab)
- [ ] Footer links are styled correctly (purple hover effect)

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### ✅ P1 #7: Order Cancellation & Refund Flow

#### Test 1: Cancel PENDING Order
**Setup:**
1. Register/login as client
2. Create order without making payment (leave at PENDING status)

**Steps:**
1. Navigate to /dashboard
2. Find PENDING order
3. Click "Cancelar" button
4. Confirm cancellation in dialog

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] Dialog text: "Esta ação não pode ser desfeita."
- [ ] After confirming, order disappears or status updates to CANCELLED
- [ ] Success toast notification appears
- [ ] No refund is processed (order was never paid)
- [ ] Email notification sent to client

#### Test 2: Cancel PAID Order (with refund)
**Setup:**
1. Create order and complete PIX payment
2. Wait for payment confirmation (order status → PAID)

**Steps:**
1. Navigate to /dashboard
2. Find PAID order
3. Click "Cancelar e Solicitar Reembolso" button
4. Confirm cancellation in dialog

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] Dialog text: "O pagamento será reembolsado e o valor retornará para sua conta em até 5 dias úteis."
- [ ] Order status changes to CANCELLED
- [ ] Payment status changes to REFUNDED
- [ ] Success message includes refund confirmation
- [ ] Email notification sent to client
- [ ] Refund appears in AbacatePay dashboard

#### Test 3: Try to Cancel IN_PROGRESS Order
**Setup:**
1. Create order, make payment
2. Have a booster accept the order (status → IN_PROGRESS)

**Steps:**
1. Navigate to /dashboard
2. Find IN_PROGRESS order
3. Attempt to cancel

**Expected Results:**
- [ ] No "Cancelar" button visible for IN_PROGRESS orders
- [ ] If API is called directly: 400 Bad Request
- [ ] Error message: "Este pedido já está em andamento e não pode ser cancelado..."
- [ ] Message suggests using dispute system: `canDispute: true`

#### Test 4: Rate Limiting (5 attempts per minute)
**Steps:**
1. Try to cancel the same order 6 times rapidly

**Expected Results:**
- [ ] First 5 attempts: Normal response (success or error)
- [ ] 6th attempt: 429 Too Many Requests
- [ ] Error message: "Muitas tentativas. Aguarde um momento."

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### ✅ P1 #8: Remove Admin Service CRUD Page

#### Test 1: Verify Service Pages Removed
**Steps:**
1. Navigate to http://localhost:3000/admin/services
2. Try to access http://localhost:3000/api/admin/services

**Expected Results:**
- [ ] /admin/services returns 404 Not Found
- [ ] /api/admin/services returns 404 Not Found

#### Test 2: Admin Dashboard Layout
**Steps:**
1. Log in as admin
2. Navigate to /admin

**Expected Results:**
- [ ] Stats grid has 3 cards (not 4)
- [ ] Cards show: Users, Orders, Revenue (no Services card)
- [ ] Grid uses `grid-cols-3` (not `grid-cols-4`)
- [ ] No "Gerenciar Serviços" quick action button
- [ ] All other admin features work normally

#### Test 3: Service Management via Seeding
**Steps:**
1. Open `prisma/seed.ts`
2. Add a new test service:
```typescript
await prisma.service.create({
  data: {
    name: 'Test Service',
    type: 'RANK_BOOST',
    game: 'CS2',
    description: 'Test service for validation',
  },
})
```
3. Run `npm run db:seed`
4. Check Prisma Studio or create order

**Expected Results:**
- [ ] Seed script runs without errors
- [ ] New service appears in database
- [ ] Service is available when creating orders
- [ ] No UI to manage services in admin panel

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### ✅ P1 #9: Add Loading States to Price Calculator

#### Test 1: Normal Price Calculation
**Steps:**
1. Navigate to http://localhost:3000/games/cs2/pricing
2. Select Premier mode
3. Click current rating: 5K
4. Click target rating: 10K
5. Click "CALCULAR PREÇO" button

**Expected Results:**
- [ ] Button immediately shows spinner icon
- [ ] Button text changes to "Calculando..."
- [ ] Button is disabled (cannot click again)
- [ ] Price display area shows spinner + "Calculando preço..."
- [ ] After ~500ms, price appears (e.g., "R$ 125.00")
- [ ] Loading states clear
- [ ] "CONTRATAR AGORA" button appears

#### Test 2: Loading States During Network Delay
**Steps:**
1. Open Chrome DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Repeat Test 1 above

**Expected Results:**
- [ ] Loading states remain active for full duration
- [ ] No timeout errors
- [ ] Eventually price loads
- [ ] Loading states clear properly

#### Test 3: Error Handling
**Steps:**
1. Temporarily break the API (e.g., set invalid URL)
2. Try to calculate price

**Expected Results:**
- [ ] Loading states appear
- [ ] After error, loading states clear
- [ ] Error toast appears: "Não foi possível calcular o preço. Tente novamente."
- [ ] Price resets to 0
- [ ] Button re-enables

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### ✅ P1 #10: Improve API Error Messages

#### Test 1: Database Connection Error (503)
**Steps:**
1. Stop database: `docker stop <postgres_container>`
2. Try to login

**Expected Results:**
- [ ] HTTP status: 503 Service Unavailable
- [ ] Error message: "Erro de conexão com o banco de dados. Tente novamente em instantes."
- [ ] NOT generic "Internal server error"

#### Test 2: Duplicate Email Registration (400)
**Steps:**
1. Register with email: duplicate@test.com
2. Register again with same email

**Expected Results:**
- [ ] HTTP status: 400 Bad Request
- [ ] Error message: "Este email já está cadastrado. Tente fazer login ou use outro email."
- [ ] NOT "Erro ao criar conta"

#### Test 3: Invalid Pricing Range (400)
**Steps:**
```bash
curl -X POST http://localhost:3000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{"game":"CS2","gameMode":"PREMIER","current":15000,"target":10000}'
```

**Expected Results:**
- [ ] HTTP status: 400 Bad Request
- [ ] Error message: "A pontuação atual deve ser menor que a pontuação desejada"
- [ ] NOT "current must be less than target"

#### Test 4: Missing Required Fields (400)
**Steps:**
```bash
curl -X POST http://localhost:3000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{"game":"CS2"}'
```

**Expected Results:**
- [ ] HTTP status: 400 Bad Request
- [ ] Error message: "Campos obrigatórios ausentes: jogo, modo, pontuação atual e desejada"
- [ ] NOT "Missing required fields"

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### ✅ P1 #11: Order Duplication Prevention UI Warning

#### Test 1: No Active Orders (Normal Flow)
**Steps:**
1. Log in as client with no active orders
2. Navigate to /games/cs2/pricing
3. Select Premier mode

**Expected Results:**
- [ ] No warning banner visible
- [ ] "CONTRATAR AGORA" button is purple (enabled)
- [ ] Can calculate price and hire normally

#### Test 2: Active Order in Same Mode
**Setup:**
1. Create PENDING order in Premier mode (don't pay)

**Steps:**
1. Navigate to /games/cs2/pricing
2. Select Premier mode
3. Calculate a price

**Expected Results:**
- [ ] Yellow warning banner appears with pulse animation
- [ ] Banner shows AlertCircle icon
- [ ] Banner text: "Você já possui um boost ativo nesta modalidade"
- [ ] Shows order count: "Você tem 1 pedido pendente..."
- [ ] "Ver Meus Pedidos" button links to /dashboard
- [ ] "CONTRATAR AGORA" button is gray and disabled
- [ ] Button text: "BOOST JÁ ATIVO NESTA MODALIDADE"
- [ ] Helper text below button: "Finalize seu pedido atual para contratar um novo"

#### Test 3: Active Order in Different Mode
**Setup:**
1. Have PENDING order in Premier mode

**Steps:**
1. Navigate to /games/cs2/pricing
2. Select Gamers Club mode
3. Calculate price

**Expected Results:**
- [ ] Warning banner does NOT appear
- [ ] "CONTRATAR AGORA" button is enabled (purple)
- [ ] Can create order in Gamers Club (different mode is allowed)

#### Test 4: Mode Switching
**Setup:**
1. Have PENDING order in Premier mode

**Steps:**
1. Navigate to /games/cs2/pricing (default: Premier selected)
2. Switch to Gamers Club tab
3. Switch back to Premier tab

**Expected Results:**
- [ ] Warning appears when Premier tab selected
- [ ] Warning disappears when Gamers Club tab selected
- [ ] Warning reappears when switching back to Premier
- [ ] Transitions are smooth (no flickering)

#### Test 5: Backend Validation (API Safety)
**Steps:**
1. Have PENDING Premier order
2. Use browser DevTools to enable the hire button
3. Try to create duplicate order

**Expected Results:**
- [ ] API returns 400 Bad Request
- [ ] Error message: "Você já possui um boost de rank Premier pendente..."
- [ ] Message suggests: "Finalize ou cancele o pedido anterior"
- [ ] Order is NOT created

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## Integration Testing

### Complete User Journey Test

**Scenario:** New user completes full boost purchase flow

**Steps:**
1. Register new account
2. Browse to CS2 pricing page
3. Calculate price for Premier 5K → 10K
4. Hire service
5. Generate PIX payment
6. Simulate payment confirmation (dev mode)
7. Check dashboard for active order
8. Try to create duplicate order (should be prevented)
9. Cancel order
10. Verify refund processed

**Expected Results:**
- [ ] All steps complete without errors
- [ ] Rate limiting doesn't block legitimate usage
- [ ] Error messages are clear and in Portuguese
- [ ] Loading states appear appropriately
- [ ] Duplication prevention works
- [ ] Cancellation and refund successful

---

## Performance Testing

### Price Calculator Performance
**Test:** Calculate price 10 times in succession

**Expected Results:**
- [ ] Average response time < 500ms
- [ ] No memory leaks
- [ ] UI remains responsive

### Dashboard Load Time
**Test:** Load dashboard with 50+ orders

**Expected Results:**
- [ ] Page loads in < 2 seconds
- [ ] No N+1 queries
- [ ] Pagination works if implemented

---

## Browser Compatibility

**Test all features in:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (iOS/Android)
- [ ] Mobile Safari (iOS)

---

## Security Testing

### Rate Limiting Bypass Attempts
**Test:** Try to bypass rate limits
- [ ] Different User-Agent headers
- [ ] Different IPs (use VPN/proxy)
- [ ] Concurrent requests

**Expected:** All attempts should still be rate limited

### Authorization Checks
**Test:** Access protected endpoints without auth
- [ ] /api/orders (GET) - should return 401
- [ ] /api/admin/stats - should return 401/403
- [ ] /api/booster/orders - should return 401/403

---

## Final Checklist

Before marking P1 as complete:

- [ ] All test cases above marked as Pass
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Database schema is correct
- [ ] Environment variables configured
- [ ] Documentation (CLAUDE.md) is accurate
- [ ] Code is committed to git
- [ ] Ready for production deployment (with minor config)

---

## Notes & Issues

Document any issues found during testing:

```
Issue #1: [Description]
Severity: High/Medium/Low
Status: Open/Fixed
Fix: [If fixed, describe solution]

Issue #2: ...
```

---

## Testing Session Summary

**Date:** _______________
**Tester:** _______________
**Environment:** Development / Staging / Production

**Overall Status:** ⬜ All Pass / ⬜ Some Failures / ⬜ Testing Incomplete

**Critical Issues Found:** ___ (count)
**Medium Issues Found:** ___ (count)
**Low Issues Found:** ___ (count)

**Ready for Production:** ⬜ Yes / ⬜ No (requires fixes)

**Notes:**
```
[Additional testing notes]
```
