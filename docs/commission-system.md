# Commission System Documentation

## Overview

The Gaming Boost platform has a flexible commission system that determines how revenue from orders is split between **Boosters** (who perform the service) and **Admins** (platform owners). This document explains all use cases and configuration options.

---

## Database Models

### 1. CommissionConfig
Global default commission percentages.

```prisma
model CommissionConfig {
  id                Int      @id
  boosterPercentage Float    @default(0.70)  // 70% to booster
  adminPercentage   Float    @default(0.30)  // 30% to admins
  enabled           Boolean  @default(true)
}
```

### 2. User (Commission Fields)
Individual override capabilities.

```prisma
model User {
  boosterCommissionPercentage Float?  // Custom % for this booster (overrides global)
  adminProfitShare            Float?  // Share of admin profits (for multi-admin split)
}
```

### 3. BoosterCommission
Records actual commission for each order.

```prisma
model BoosterCommission {
  orderId    Int      @unique
  boosterId  Int
  orderTotal Float
  percentage Float    // % used for this order
  amount     Float    // Calculated amount
  status     CommissionStatus  // PENDING, PAID, CANCELLED
}
```

### 4. AdminRevenue
Records admin revenue for each order (supports multiple admins).

```prisma
model AdminRevenue {
  orderId    Int
  adminId    Int
  orderTotal Float
  percentage Float
  amount     Float
  status     RevenueStatus
}
```

### 5. BoosterCommissionHistory
Audit trail for commission changes.

```prisma
model BoosterCommissionHistory {
  boosterId          Int
  previousPercentage Float?
  newPercentage      Float
  changedBy          Int      // Admin who made the change
  reason             String?
}
```

---

## Commission Resolution Priority

When calculating commissions for an order, the system uses this priority:

```
1. Booster's Custom Commission (User.boosterCommissionPercentage)
   ↓ (if null)
2. Global Commission Config (CommissionConfig.boosterPercentage)
   ↓ (if not found)
3. Default Fallback (70% booster / 30% admin)
```

**Code Reference:** `src/services/order.service.ts` → `getCommissionConfig()`

---

## Use Cases

### Use Case 1: Default Global Commission

**Scenario:** A new booster accepts an order without any custom commission set.

**Flow:**
1. System checks if booster has `boosterCommissionPercentage` → `null`
2. System fetches active `CommissionConfig` → `{ boosterPercentage: 0.70, adminPercentage: 0.30 }`
3. Commission calculated: 70% to booster, 30% to admins

**Example:**
```
Order Total: R$ 100.00
Booster receives: R$ 70.00 (70%)
Admins receive: R$ 30.00 (30%)
```

---

### Use Case 2: Custom Booster Commission

**Scenario:** Admin sets a custom 80% commission for a top-performing booster.

**Configuration:**
1. Admin goes to `/admin/users` → selects booster
2. Sets `boosterCommissionPercentage: 0.80`
3. Change is logged in `BoosterCommissionHistory`

**Flow:**
1. Booster accepts order
2. System checks `boosterCommissionPercentage` → `0.80`
3. Commission calculated: 80% to booster, 20% to admins

**Example:**
```
Order Total: R$ 100.00
Booster receives: R$ 80.00 (80%)
Admins receive: R$ 20.00 (20%)
```

---

### Use Case 3: Multi-Admin Profit Split

**Scenario:** Platform has 3 admins with different profit shares.

**Configuration:**
```
Admin A: adminProfitShare = 0.50 (50%)
Admin B: adminProfitShare = 0.30 (30%)
Admin C: adminProfitShare = 0.20 (20%)
```

**Flow:**
1. Order of R$ 100.00 completed
2. Booster gets 70% → R$ 70.00
3. Admin revenue is R$ 30.00, split by shares:
   - Admin A: R$ 15.00 (50% of R$ 30)
   - Admin B: R$ 9.00 (30% of R$ 30)
   - Admin C: R$ 6.00 (20% of R$ 30)

**Code Reference:** `src/services/order.service.ts` → `acceptOrder()` lines 436-462

---

### Use Case 4: Admin Without Profit Share

**Scenario:** An admin has `adminProfitShare = 0` or `null`.

**Behavior:**
- If some admins have shares and some don't, only those with shares receive revenue
- If NO admins have shares, revenue is split equally among all active admins

**Example (equal split):**
```
3 Admins with adminProfitShare = 0 or null
Admin revenue R$ 30.00 → each gets R$ 10.00 (1/3)
```

---

### Use Case 5: Updating Global Commission

**Scenario:** Platform decides to increase booster share from 70% to 75%.

**Flow:**
1. Admin goes to `/admin/commission-config`
2. Sets `boosterPercentage: 75%`, `adminPercentage: 25%`
3. System validates sum = 100%
4. Previous config is disabled, new config created

**Important:**
- Only affects **new orders** after the change
- Existing commissions keep their original percentages

---

### Use Case 6: Commission Created on Order Accept

**Trigger:** When a booster accepts a PAID order.

**Actions (in transaction):**
1. Order status changes: `PAID` → `IN_PROGRESS`
2. `BoosterCommission` record created (status: `PENDING`)
3. `AdminRevenue` records created for each active admin (status: `PENDING`)

**Code Reference:** `src/services/order.service.ts` → `acceptOrder()`

---

### Use Case 7: Commission Released on Order Complete

**Trigger:** When booster marks order as completed.

**Actions (in transaction):**
1. Order status changes: `IN_PROGRESS` → `COMPLETED`
2. `BoosterCommission` status: `PENDING` → `PAID`, sets `paidAt`
3. `AdminRevenue` status: `PENDING` → `PAID`, sets `paidAt`

**Code Reference:** `src/services/order.service.ts` → `completeOrder()`

---

### Use Case 8: Commission History Tracking

**Scenario:** Admin changes a booster's commission and wants to track changes.

**Tracked Data:**
- `previousPercentage` - Old value (null if first time)
- `newPercentage` - New value
- `changedBy` - Admin who made the change
- `reason` - Optional explanation
- `createdAt` - Timestamp

**API Endpoint:** `GET /api/admin/users/[id]/commission-history`

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/commission-config` | GET | Get current global config |
| `/api/admin/commission-config` | PUT | Update global percentages |
| `/api/admin/users/[id]` | PUT | Update user's custom commission |
| `/api/admin/users/[id]/commission-history` | GET | Get booster's commission change history |

---

## UI Pages

| Page | Description |
|------|-------------|
| `/admin/commission-config` | Configure global commission percentages |
| `/admin/users` | View/edit user details including custom commissions |

---

## Validation Rules

1. **Sum must equal 100%**: `boosterPercentage + adminPercentage = 1.0`
2. **Valid range**: Both percentages must be between 0 and 1 (0% to 100%)
3. **Custom commission only for boosters**: `boosterCommissionPercentage` can only be set if `role = BOOSTER`
4. **Profit share only for admins**: `adminProfitShare` can only be set if `role = ADMIN`

---

## Status Flow

```
Order Status:          PENDING → PAID → IN_PROGRESS → COMPLETED
                                         ↑              ↑
Commission Created: ─────────────────────┘              │
Commission Released: ───────────────────────────────────┘
```

**Commission Statuses:**
- `PENDING` - Created but not released (order in progress)
- `PAID` - Released (order completed)
- `CANCELLED` - Order was cancelled

---

## Example Calculation

```typescript
// Input
const orderTotal = 150.00
const boosterPercentage = 0.75  // 75%

// Calculation
const boosterCommission = orderTotal * boosterPercentage
// = 150 * 0.75 = 112.50

const adminRevenue = orderTotal - boosterCommission
// = 150 - 112.50 = 37.50

const adminPercentage = 1 - boosterPercentage
// = 0.25 (25%)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database models |
| `src/services/order.service.ts` | Commission logic |
| `src/app/api/admin/commission-config/route.ts` | API for global config |
| `src/app/api/admin/users/[id]/route.ts` | API for user commission |
| `src/app/admin/commission-config/page.tsx` | Admin UI |
