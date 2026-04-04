# Design System Centralization — Design Spec
**Date:** 2026-04-04  
**Status:** Approved

---

## Overview

Consolidate the project's dual token system into a single, reliable source of truth. The project currently has two overlapping color systems: CSS variable-based semantic tokens (`bg-surface-card`, `text-primary`, `bg-action-primary`, etc.) and direct brand palette classes (`bg-brand-black`, `bg-brand-purple`, `text-brand-gray-*`). Tailwind v4 has compatibility issues with CSS variable tokens, causing unreliable rendering. The CSS tokens are removed entirely; the brand palette becomes the only system. Documentation is consolidated from 4 files into 2.

---

## What Changes

### 1. Remove CSS Token System

**`tailwind.config.js`** — Remove these token sections entirely:
- `colors.surface` (surface-page, surface-card, surface-elevated, surface-subtle)
- `colors.action` (action-primary, action-primary-hover, action-secondary, action-strong, action-danger)
- `colors.text` (text-primary, text-secondary, text-muted, text-brand, text-on-brand) — these conflict with Tailwind's built-in `text-*`
- `colors.border-ds` (border-default, border-brand)
- `colors.status` (status-success, status-warning, status-error)

**Keep:** shadcn/ui token sections, brand palette (`brand-black`, `brand-black-light`, `brand-purple-*`, `brand-gray-*`, `brand-red`), custom screens, fonts, shadows, animations.

**`src/app/globals.css`** — Remove CSS variable declarations:
- `--surface-*`, `--action-*`, `--text-*` (non-shadcn), `--status-*`, `--border-default`, `--border-brand`

**Keep:** All shadcn/ui variables (`--background`, `--foreground`, `--primary`, `--card`, etc.), font imports, animation keyframes, utility classes.

### 2. Migrate 21 Files

Replace all CSS token class usages with brand palette equivalents. See mapping table below.

### 3. Consolidate Documentation

- **Rewrite** `docs/design_system.md` — complete authoritative reference, brand palette only
- **Add** Design System Quick Reference section to `CLAUDE.md`
- **Delete** `docs/superpowers/designsystem.md` (duplicate)
- **Delete** `.agent/rules/designsystem.md` (duplicate)

---

## Token Mapping Table

| Remove (CSS token) | Use instead (brand palette) |
|---|---|
| `bg-surface-page` | `bg-brand-black` |
| `bg-surface-card` | `bg-brand-black-light` |
| `bg-surface-elevated` | `bg-brand-black-light` |
| `bg-surface-subtle` | `bg-brand-black/50` |
| `text-primary` | `text-white` |
| `text-secondary` | `text-brand-gray-300` |
| `text-muted` | `text-brand-gray-500` |
| `text-brand` | `text-brand-purple` |
| `text-on-brand` | `text-white` |
| `bg-action-primary` | `bg-brand-purple` |
| `hover:bg-action-primary-hover` | `hover:bg-brand-purple-light` |
| `bg-action-danger` | `bg-red-600` |
| `bg-action-strong` | `bg-brand-purple-dark` |
| `border-border-default` | `border-white/10` |
| `border-border-brand` | `border-brand-purple` |
| `focus:border-border-brand` | `focus:border-brand-purple` |
| `status-success` (bg/text) | `bg-green-500/20 text-green-300` |
| `status-warning` (bg/text) | `bg-yellow-500/20 text-yellow-300` |
| `status-error` (bg/text) | `bg-red-500/20 text-red-300` |

---

## Documentation Plan

### `docs/design_system.md` (rewrite)

Complete reference covering:
1. **Colors** — brand palette with class names, hex values, and usage notes
2. **Typography** — Orbitron (titles), Rajdhani (UI elements), sans (body); inline `style` fallback pattern
3. **Surfaces & Backgrounds** — brand-black (page), brand-black-light (cards/elevated)
4. **Text Colors** — white (primary), brand-gray-300 (secondary), brand-gray-500 (muted), brand-purple (accent)
5. **Buttons** — bg-brand-purple hover:bg-brand-purple-light; bg-red-600 for danger
6. **Cards** — bg-brand-black-light border border-white/10 glassmorphism pattern
7. **Inputs** — bg-brand-black-light border-white/10 focus:border-brand-purple
8. **Borders** — white/10 (default), brand-purple (focus/active)
9. **Status badges** — green-500/20 (success), yellow-500/20 (warning), red-500/20 (error)
10. **Effects** — glow shadows (shadow-glow-sm/md/lg), hover-glow, hover-lift, animate-glow, bg-gradient-brand
11. **Spacing** — container mx-auto px-4, p-6 cards, gap-4/gap-8
12. **Fonts** — Orbitron (headings), Rajdhani (labels/UI), system-sans (body)

### `CLAUDE.md` — Design System Quick Reference

New section added under the existing Design System heading:

```
### Quick Reference

**NEVER use:** hexadecimal values, CSS token classes (bg-surface-*, text-primary, bg-action-*), or arbitrary Tailwind values.

**ALWAYS use brand palette:**
- Backgrounds: `bg-brand-black` (page), `bg-brand-black-light` (cards)
- Purple: `bg-brand-purple`, `text-brand-purple`, `border-brand-purple`
- Purple variants: `bg-brand-purple-dark` (strong), `bg-brand-purple-light` (hover), `text-brand-purple-lighter` (subtle)
- Text: `text-white` (primary), `text-brand-gray-300` (secondary), `text-brand-gray-500` (muted)
- Borders: `border-white/10` (default), `border-brand-purple` (focus/active)
- Status: `bg-green-500/20 text-green-300`, `bg-yellow-500/20 text-yellow-300`, `bg-red-500/20 text-red-300`
- Effects: `shadow-glow`, `.hover-glow`, `.bg-gradient-brand`, `.animate-glow`
- Fonts: `font-orbitron` (titles), `font-rajdhani` (UI), `font-sans` (body)
```

---

## Files to Migrate (21 files using CSS tokens)

Files confirmed to contain CSS token class usages:
1. `src/app/admin/commissions/page.tsx` — already corrected (reference)
2. `src/app/admin/payments/page.tsx`
3. `src/app/admin/orders/page.tsx`
4. `src/app/admin/orders/[id]/page.tsx`
5. `src/app/admin/users/page.tsx`
6. `src/app/admin/pricing/page.tsx`
7. `src/app/admin/boosters/page.tsx`
8. `src/app/admin/page.tsx`
9. `src/app/booster/page.tsx`
10. `src/app/booster/payments/page.tsx`
11. `src/app/dashboard/page.tsx`
12. `src/components/order/order-chat.tsx`
13. `src/components/common/StatusBadge.tsx`
14. Additional components discovered during execution

---

## What Does NOT Change

- Brand palette class names and their hex values
- shadcn/ui CSS variables (`--background`, `--foreground`, `--primary`, etc.)
- Animation keyframes and utility classes (`.hover-glow`, `.animate-glow`, `.bg-gradient-brand`, etc.)
- Glassmorphism patterns (backdrop-blur, bg-white/5, etc.)
- Glow shadow utilities (shadow-glow-sm/md/lg)
- All Tailwind config except the 5 removed token sections
- Component structure and logic — styling changes only

---

## Out of Scope

- shadcn/ui component overrides (Button, Input primitives in `src/components/ui/`) — they use shadcn tokens which are separate
- Full UI/UX audit — that is Sub-project 2, runs after this is complete
- Dark/light mode toggle — project is dark mode only
