# Commissions Management — Design Spec
**Date:** 2026-04-04  
**Status:** Approved

---

## Overview

Centralize all commission configuration and visibility into a dedicated `/admin/commissions` page. Remove the existing commission config from `/admin/payments` (Configurações tab). Eliminate all hardcoded percentage fallbacks — config lives in the database exclusively, seeded with correct defaults.

---

## Commission Math Model

```
Order Total
  ├── Dev-Admin: devAdminPercentage × Total           (off-the-top, first)
  └── Remaining = Total − Dev-Admin
        ├── Booster: boosterPercentage × Remaining
        └── Admin:   (1 − boosterPercentage) × Remaining   (automatic, never stored)
```

**Example with defaults (booster 25%, dev-admin 10%):**
```
R$ 100.00
  ├── Dev-Admin: 10% → R$ 10.00
  └── Remaining: R$ 90.00
        ├── Booster: 25% → R$ 22.50
        └── Admin:   75% → R$ 67.50
```

---

## Data Model

### `CommissionConfig` (existing table)
- `boosterPercentage` — global default booster % (editable)
- `devAdminPercentage` — dev-admin off-the-top % (editable)
- `adminPercentage` — **derived only**, never stored: `1 − boosterPercentage`
- If no active `CommissionConfig` exists → throw explicit error, never fall back to hardcoded values

### `User.boosterCommissionPercentage` (existing field)
- `Float?` — individual booster override
- `null` = inherits global `boosterPercentage`
- Admin can set to a specific value or clear it (back to global)

### Revenue snapshot tables (no changes)
- `BoosterCommission` — snapshot of booster earnings per order (% + amount at acceptance time)
- `AdminRevenue` — snapshot of admin earnings per order
- `DevAdminRevenue` — snapshot of dev-admin earnings per order
- **Snapshots are immutable** — changing % only affects future orders

---

## New Page: `/admin/commissions`

### Access control
| Role | Access | Can edit |
|------|--------|----------|
| Dev-Admin | Full read | No |
| Admin | Full read | Yes |
| Booster | No access (redirect) | — |
| Client | No access (redirect) | — |

### Block 1 — Global Configuration
- Field: **% Dev-Admin** (editable by admin)
- Field: **% Booster padrão** (editable by admin)
- Field: **% Admin** — read-only, auto-calculated: `100% − % Booster`
- **Live preview**: given R$100, shows in real time how much each party receives as the sliders/inputs change
- Save button — persists to `CommissionConfig`, affects future orders only
- Validation: `devAdminPercentage` must be between 0–100%; `boosterPercentage` must be between 0–100%; sum can exceed 100% of total is not possible because admin gets the remainder of `remaining` — no cross-validation needed beyond individual range checks

### Block 2 — Booster Table
Columns:
- Avatar + Name
- **% Individual** — shows override if set, otherwise shows "padrão (X%)" where X is the current global
- **% Admin resultante** — read-only derived: `100% − % individual booster`
- **Edit button** — inline: opens a small input to set or clear the override

Behavior:
- Clearing the field (setting to null) reverts the booster to global default
- Changes save to `User.boosterCommissionPercentage` via existing `/api/admin/users/[id]` PATCH endpoint
- Table shows all boosters with `role: BOOSTER` and `active: true`

### Block 3 — Live Preview per Booster (optional, deferred)
Not in MVP. The per-booster preview of "if this booster accepts a R$X order, they get R$Y" can be a future enhancement.

---

## Changes to Existing Code

### `src/services/order.service.ts — getCommissionConfig`
- Remove hardcoded fallbacks (`let boosterPercentage = 0.70`, `let adminPercentage = 0.30`)
- If no active `CommissionConfig` found → return `failure('Configuração de comissão não encontrada')`
- `adminPercentage` is always `1 − boosterPercentage` (calculated inline, not read from DB)
- Per-booster override logic stays: if `boosterCommissionPercentage` is set, use it; admin gets `1 − override`

### `prisma/seed.ts`
- Update `CommissionConfig` seed to: `boosterPercentage: 0.25`, `devAdminPercentage: 0.10`
- `adminPercentage` in seed stays at `0.75` for schema compatibility (but is always recalculated in code)

### `prisma/schema.prisma — CommissionConfig`
- No structural changes needed — `adminPercentage` field can remain for DB compatibility but is treated as derived in all application code

### `/admin/payments` — Configurações tab
- Remove the commission config form from this tab
- Replace with a link/button pointing to `/admin/commissions`

### Navigation
- Add "Comissões" link to the admin sidebar/nav pointing to `/admin/commissions`

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/commission-config` | Fetch current config (already exists) |
| PATCH | `/api/admin/commission-config` | Update global % (already exists, verify it drops adminPercentage auto-calc) |
| PATCH | `/api/admin/users/[id]` | Update booster individual % (already exists) |
| GET | `/api/admin/users?role=BOOSTER` | Fetch booster list with their % (already exists) |

No new API endpoints required — all existing endpoints can be reused.

---

## What Does NOT Change

- `BoosterCommission`, `AdminRevenue`, `DevAdminRevenue` snapshot logic — immutable per order
- Dev-admin revenue separation — stays in its own table
- Booster's own view (`/booster/payments`) — still shows only their own commission %
- Withdrawal flows — unaffected

---

## Out of Scope (MVP)

- Per-booster live preview card
- Commission history audit trail (who changed what and when)
- Bulk override reset (reset all boosters to global at once)
