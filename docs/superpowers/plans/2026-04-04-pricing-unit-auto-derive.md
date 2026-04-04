# Pricing Unit Auto-Derive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the manual "Unidade" field from the admin pricing form and derive its value automatically from the game mode in the API routes.

**Architecture:** Two targeted changes — (1) API routes stop accepting `unit` from the request body and instead derive it from `gameMode`; (2) the admin page removes all `unit` state, the form field, and the table column. No DB schema changes, no calculator changes.

**Tech Stack:** Next.js 15 App Router, TypeScript, React

---

## File Map

| File | Change |
|------|--------|
| `src/app/api/admin/pricing/route.ts` | Remove `unit` from POST body; auto-derive from `gameMode` |
| `src/app/api/admin/pricing/[id]/route.ts` | Remove `unit` from PUT body; auto-derive when `gameMode` present |
| `src/app/admin/pricing/page.tsx` | Remove `unit` state, `getDefaultUnit()`, form field, table column |

---

### Task 1: Fix API routes — auto-derive unit from gameMode

**Files:**
- Modify: `src/app/api/admin/pricing/route.ts`
- Modify: `src/app/api/admin/pricing/[id]/route.ts`

No tests exist for these routes (no `src/__tests__/api/admin/pricing/` directory). Verification is done by running the build.

- [ ] **Step 1: Fix the POST route**

  In `src/app/api/admin/pricing/route.ts`, replace line 91:
  ```ts
  const { game, gameMode, serviceType: bodyServiceType, rangeStart, rangeEnd, price, unit, enabled } = body
  ```
  With:
  ```ts
  const { game, gameMode, serviceType: bodyServiceType, rangeStart, rangeEnd, price, enabled } = body
  ```

  Then replace line 95:
  ```ts
  if (!game || !gameMode || rangeStart === undefined || rangeEnd === undefined || !price || !unit) {
  ```
  With:
  ```ts
  if (!game || !gameMode || rangeStart === undefined || rangeEnd === undefined || !price) {
  ```

  Then add the derivation immediately before the `db.pricingConfig.create` call (line 119). Replace:
  ```ts
  const pricingConfig = await db.pricingConfig.create({
    data: {
      game,
      gameMode,
      serviceType: svcType,
      rangeStart: parseInt(rangeStart),
      rangeEnd: parseInt(rangeEnd),
      price: parseFloat(price),
      unit,
      enabled: enabled !== undefined ? enabled : true
    }
  })
  ```
  With:
  ```ts
  const unit = gameMode === 'PREMIER' ? '1000 pontos' : '1 nível'

  const pricingConfig = await db.pricingConfig.create({
    data: {
      game,
      gameMode,
      serviceType: svcType,
      rangeStart: parseInt(rangeStart),
      rangeEnd: parseInt(rangeEnd),
      price: parseFloat(price),
      unit,
      enabled: enabled !== undefined ? enabled : true
    }
  })
  ```

- [ ] **Step 2: Fix the PUT route**

  In `src/app/api/admin/pricing/[id]/route.ts`, replace line 60:
  ```ts
  const { rangeStart, rangeEnd, price, unit, enabled } = body
  ```
  With:
  ```ts
  const { rangeStart, rangeEnd, price, enabled } = body
  ```

  Then replace line 109:
  ```ts
  if (unit !== undefined) updateData.unit = unit
  ```
  With nothing — delete that line entirely.

  Note: The PUT route handles partial updates (only the fields sent in the body are updated). Since `unit` is now always derived from the stored `gameMode` and `gameMode` is never changed via PUT (it's not in the update fields), the existing `unit` value in the database will remain correct for all future updates. No further change needed.

- [ ] **Step 3: Verify build passes**

  Run: `npm run build`

  Expected: Completes with zero TypeScript errors. No "unit is not defined" or "unused variable" warnings.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/api/admin/pricing/route.ts src/app/api/admin/pricing/[id]/route.ts
  git commit -m "refactor: auto-derive pricing unit from gameMode in API routes"
  ```

---

### Task 2: Remove unit field from admin pricing page

**Files:**
- Modify: `src/app/admin/pricing/page.tsx`

- [ ] **Step 1: Remove the `unit` state declaration**

  Find and delete line 216:
  ```tsx
  const [unit, setUnit] = useState('')
  ```

- [ ] **Step 2: Remove the `getDefaultUnit` helper and its auto-fill `useEffect`**

  Find and delete the useEffect at lines 245–251:
  ```tsx
  // Auto-fill unit when mode changes (only if not editing)
  useEffect(() => {
    if (!isEditing && !unit) {
      setUnit(getDefaultUnit())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode])
  ```

  Find and delete the `getDefaultUnit` function at lines 511–513:
  ```tsx
  const getDefaultUnit = () => {
    return selectedMode === 'PREMIER' ? '1000 pontos' : '1 nível'
  }
  ```

- [ ] **Step 3: Fix `handleSubmit` — remove unit from validation and body**

  Find line 310:
  ```tsx
  if (!rangeStart || !rangeEnd || !price || !unit) {
  ```
  Replace with:
  ```tsx
  if (!rangeStart || !rangeEnd || !price) {
  ```

  Find lines 318–327 (the body object inside `handleSubmit`):
  ```tsx
  const body = {
    game: selectedGame,
    gameMode: selectedMode,
    serviceType: selectedServiceType,
    rangeStart: parseInt(rangeStart),
    rangeEnd: parseInt(rangeEnd),
    price: parseFloat(price),
    unit,
    enabled: true,
  }
  ```
  Replace with:
  ```tsx
  const body = {
    game: selectedGame,
    gameMode: selectedMode,
    serviceType: selectedServiceType,
    rangeStart: parseInt(rangeStart),
    rangeEnd: parseInt(rangeEnd),
    price: parseFloat(price),
    enabled: true,
  }
  ```

  Also find in the optimistic update for editing (around line 347):
  ```tsx
  setConfigs(prev => prev.map(c =>
    c.id === editingId ? { ...c, ...body, updatedAt: new Date().toISOString() } : c
  ))
  ```
  This spreads `body` into the config — since `body` no longer has `unit`, the existing `unit` from `c` will be preserved via the spread. No change needed here.

- [ ] **Step 4: Fix `handleEdit` — remove setUnit**

  Find line 385:
  ```tsx
  setUnit(config.unit)
  ```
  Delete this line.

- [ ] **Step 5: Fix `resetForm` — remove setUnit**

  Find line 508:
  ```tsx
  setUnit('')
  ```
  Delete this line.

- [ ] **Step 6: Remove the "Unidade" form field**

  Find and delete the entire second column of the price/unit grid (lines 730–742):
  ```tsx
  <div className="space-y-2">
    <Label htmlFor="unit" className="text-brand-gray-300">Unidade</Label>
    <Input
      id="unit"
      type="text"
      value={unit}
      onChange={(e) => setUnit(e.target.value)}
      placeholder={getDefaultUnit()}
      required
      disabled={isSaving}
      className="bg-brand-black border-white/10 focus:border-brand-purple transition-all"
    />
  </div>
  ```

  The parent grid `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` (line 710) now has only one child — the price input. Change its className to remove the two-column layout:
  ```tsx
  <div className="grid grid-cols-1 gap-4">
  ```

- [ ] **Step 7: Fix preview — remove unit display**

  Find lines 757–759 inside the preview block:
  ```tsx
  <span className="text-brand-gray-500 text-xs ml-1">
    / {unit || getDefaultUnit()}
  </span>
  ```
  Replace with the derived value directly:
  ```tsx
  <span className="text-brand-gray-500 text-xs ml-1">
    / {selectedMode === 'PREMIER' ? '1000 pontos' : '1 nível'}
  </span>
  ```

- [ ] **Step 8: Remove the "Unidade" column from the table**

  Find and delete the table header cell (line 836):
  ```tsx
  <TableHead className="text-brand-gray-300 hidden sm:table-cell">Unidade</TableHead>
  ```

  Find and delete the table data cell (lines 867–869):
  ```tsx
  <TableCell className="text-brand-gray-400 hidden sm:table-cell">
    {config.unit}
  </TableCell>
  ```

- [ ] **Step 9: Verify build passes**

  Run: `npm run build`

  Expected: Zero TypeScript errors. No "unit is not defined", no "setUnit is not defined", no "getDefaultUnit is not defined" errors.

- [ ] **Step 10: Commit**

  ```bash
  git add src/app/admin/pricing/page.tsx
  git commit -m "refactor: remove unit field from admin pricing form"
  ```
