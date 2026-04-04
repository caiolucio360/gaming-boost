# CS2 Calculator — Service Type Selection UX
**Date:** 2026-04-04  
**Status:** Approved

---

## Problem

The CS2 calculator (`/games/cs2/pricing`) shows the service type tabs (Rank Boost / Duo Boost) and the game mode tabs (Premier / Gamers Club) simultaneously at the top of the card. The user is expected to understand both choices at a glance, but there is no visual hierarchy guiding them through the selection flow.

---

## Solution

Introduce a two-step funnel inside the existing calculator card:

1. **Step 1 (full cards):** The user sees two large, visually distinct service type cards. No mode selector or rating grid is visible yet.
2. **Step 1 (collapsed):** Once the user picks a service type, the two cards collapse into a compact horizontal bar. The selected service is highlighted; the other is dimmed but still clickable.
3. **Step 2 (revealed):** The mode selector (Premier / Gamers Club) and the full calculator body slide in below with a fade-up animation.

---

## Component Changes

### `src/components/games/cs2-calculator.tsx`

**State change:**
- `selectedServiceType` changes initial value from `'RANK_BOOST'` to `null`
- Type: `ServiceType | null`

**Two display phases for service selection:**

**Phase A — Full cards (when `selectedServiceType === null`):**
- Two cards in a `grid grid-cols-2 gap-4` (single column on mobile: `grid-cols-1 sm:grid-cols-2`)
- Each card: `bg-brand-black-light border border-brand-purple/30 rounded-xl p-6 cursor-pointer hover:border-brand-purple hover:shadow-glow transition-all`
- Card contents (vertically centered): icon (Sword for RANK_BOOST, Users for DUO_BOOST) + title (`font-orbitron`) + description (`font-rajdhani text-sm text-brand-gray-400`)
- On click: set `selectedServiceType`, trigger collapse animation

**Phase B — Compact bar (when `selectedServiceType !== null`):**
- A single horizontal `flex gap-2` row replacing the full cards
- Selected item: `bg-brand-purple text-white rounded-lg px-4 py-2 flex items-center gap-2` with small icon + name + `Check` icon
- Unselected item: `bg-brand-black-light border border-white/10 text-brand-gray-400 rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer hover:border-brand-purple/50 hover:text-white`
- Clicking the unselected item: switches `selectedServiceType`, resets `selectedCurrent`, `selectedTarget`, `price`

**Calculator body reveal:**
- Wrapped in a `div` that is hidden (`hidden`) when `selectedServiceType === null` and visible when not null
- Reveal animation: `animate-fadeInUp` (already defined in globals.css)
- Includes: service description line, mode selector tabs, active order warning, rating grids, calculate button, price result

**Guard in `handleHire`:**
- Already guards on `!selectedCurrent || !selectedTarget || price <= 0` — no change needed
- `selectedServiceType` being null is safe since the hire button is inside the revealed section

---

## What Does NOT Change

- Mode selector (Premier / Gamers Club tabs) — no changes, just moves inside the revealed section
- Rating grid logic — no changes
- Price calculation logic — no changes
- `handleModeChange`, `calculatePrice`, `handleHire` — no logic changes
- API calls — no changes
- All other pages and components

---

## Animation

- Full cards → compact bar: CSS `transition-all duration-300` on each card element (height + opacity handled by conditional render swap, not CSS height animation — the swap itself is instant, which is fine since the two phases are visually very different)
- Calculator body reveal: `animate-fadeInUp` class on the wrapper div, applied when `selectedServiceType` becomes non-null (use a `key` prop or re-render trigger to re-run the animation on service type change)

---

## Icons

- **Rank Boost:** `Sword` from `lucide-react` (already imported area — add if not present)
- **Duo Boost:** `Users` from `lucide-react`
- **Selected indicator:** `Check` from `lucide-react`

---

## Mobile

- Full cards: `grid-cols-1 sm:grid-cols-2` — stacked on small screens
- Compact bar: `flex-wrap` so both pills wrap on very small screens if needed
