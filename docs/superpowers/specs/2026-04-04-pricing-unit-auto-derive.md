# Pricing Unit Auto-Derive — Design Spec
**Date:** 2026-04-04  
**Status:** Approved

---

## Problem

The admin pricing form (`/admin/pricing`) has a "Unidade" text field that the admin must fill manually when creating or editing a price range. The valid values are always `"1000 pontos"` (for PREMIER) or `"1 nível"` (for GAMERS_CLUB) — they are fully determined by the game mode. The field is confusing because it implies configurability where there is none.

---

## Solution

Remove the `unit` input from the admin form entirely. Derive the value automatically from `gameMode` in the API routes before saving to the database.

**Derivation rule:**
- `gameMode === 'PREMIER'` → `unit = "1000 pontos"`
- `gameMode === 'GAMERS_CLUB'` → `unit = "1 nível"`

---

## What Changes

### `src/app/admin/pricing/page.tsx`

- Remove `unit` from the `PricingConfig` interface display columns in the table (column "Unidade" in the table rows)
- Remove `const [unit, setUnit] = useState('')`
- Remove `getDefaultUnit()` helper function
- Remove the `useEffect` that auto-fills `unit` when mode changes
- Remove the "Unidade" label + input field from the form (lines ~731–737)
- Remove `unit` from the `handleSubmit` validation check (`!unit` guard) and from the body sent to POST
- Remove `setUnit(config.unit)` from the edit-load block
- Remove `setUnit('')` from the form reset block
- Remove the inline preview `/ {unit || getDefaultUnit()}` shown next to the price input

### `src/app/api/admin/pricing/route.ts` (POST)

- Remove `unit` from destructured body
- Remove `!unit` from the required-fields validation
- Add derivation before `db.pricingConfig.create`:
  ```ts
  const unit = gameMode === 'PREMIER' ? '1000 pontos' : '1 nível'
  ```

### `src/app/api/admin/pricing/[id]/route.ts` (PUT)

- Remove `unit` from destructured body
- Remove `if (unit !== undefined) updateData.unit = unit`
- When `gameMode` is present in the update body, derive and set unit:
  ```ts
  if (gameMode !== undefined) {
    updateData.gameMode = gameMode
    updateData.unit = gameMode === 'PREMIER' ? '1000 pontos' : '1 nível'
  }
  ```
- When `gameMode` is absent (partial update), leave `unit` unchanged in the database

---

## What Does NOT Change

- Prisma schema — `unit` column stays as-is
- Database records — existing values remain valid
- Calculator (`cs2-calculator.tsx`) — no changes
- Pricing calculation logic (`src/lib/pricing.ts`) — no changes
- `GET` routes — no changes
- Any other page or component

---

## Out of Scope

- Removing the `unit` column from the database (Approach B — deferred)
- Any changes to the client-facing calculator UI
- Any other pricing UX improvements
