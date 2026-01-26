# Backend Refactor & Deep Analysis: Prioritized Roadmap

## Overview
This document outlines the prioritized plan to refactor the backend architecture to **Clean Architecture** principles. The goal is to eliminate code duplication, enforce data integrity, and create a maintainable "Thin Controller, Rich Service" structure.

> [!IMPORTANT]
> **Strategy: Backend First**
> We will completely refactor the Backend (Schema + Services + API) **first**.
> We accept that **Frontend will be broken** during this process.
> Once the Backend is solid and thoroughly verified (via Tests/API calls), we will create a NEW plan to update the Frontend.

> [!NOTE]
> **Breaking Changes Allowed**
> The project is **not in production**. We will aggressively remove unused tables, columns, and relations.
> **Rule**: Every element in the Schema must be used by the Backend. If it's not used, it gets deleted.

## Priority 1: Critical Schema & Data Integrity (Foundation)
**Goal**: Normalize the database (3NF) and enforce strict typing. Remove all "dead" schema elements.

### Step 1.1: Schema Enforcement
- [ ] **Create `PaymentStatus` Enum**: Replace `String` status in `Payment` model with `enum { PENDING, PAID, EXPIRED, CANCELLED, REFUNDED }`.
- [ ] **Create `WithdrawalStatus` Enum**: Ensure strict typing for withdrawals.

### Step 1.2: Deep Cleaning (Breaking Changes)
**Action**:
- [ ] **Drop Redundant Columns**: Remove these columns from `Order` (data exists in `BoosterCommission` / `AdminRevenue`):
    - `boosterCommission`
    - `adminRevenue`
    - `boosterPercentage`
    - `adminPercentage`
- [ ] **Audit Relations**: Verify if all relations (e.g., `steamConsent`) are actually used. If not, mark for deletion.

## Priority 2: Centralize Business Logic (The Refactor)
**Goal**: Move logic from API Routes to Services. Services become the "Use Cases".

### Step 2.1: Payment & Webhook Logic
- [ ] **Enhance `PaymentService`**:
    - Add `processWebhookEvent(data)`: Single entry point.
    - Add `confirmPayment(paymentId)`: Transactional update.
- [ ] **Refactor Webhook Route**: `src/app/api/webhooks/abacatepay/route.ts` -> Calls Service.

### Step 2.2: Order Creation & Validation
- [ ] **Enhance `OrderService`**:
    - Add `createAuthenticatedOrder(userId, input)`: Transactional creation.
- [ ] **Refactor Order Route**: `src/app/api/orders/route.ts` -> Calls Service.

## Priority 3: Standardization & Cleanup
**Goal**: Ensure the backend is clean and ready for the Frontend phase.

### Step 3.1: Service Response Pattern
- [ ] Adopt `Result<T>` pattern for all services.

### Step 3.2: Backend Verification
- [ ] **Fix Tests**: Update backend tests to reflect Schema changes.
- [ ] **Verify Usage**: Run a final check to ensure NO unused schema elements remain.

## Future Phase: Frontend Refactor
*To be planned after Backend is complete.*
- Update UI to use new Enum values.
- Update UI to fetch Commission/Revenue data from relations.
