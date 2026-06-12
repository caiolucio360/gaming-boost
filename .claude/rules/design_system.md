# Design System — FlautasBoost

**Single source of truth for all styling decisions.**

> **Golden Rule:** NEVER use hexadecimal values (`#7C3AED`), arbitrary Tailwind values, raw
> `gray-*`, or fixed neutral classes that can't theme-switch (`bg-brand-black`,
> `bg-brand-black-light`, `border-white/10`, `text-brand-gray-300/400/500`). For neutral
> surfaces, text and borders use the **theme tokens** below (light/dark aware); for accents use
> the **brand-purple** palette. Legacy CSS token classes (`bg-surface-card`, `text-primary`,
> `bg-action-primary`) remain forbidden.

> **Light & dark theme:** the app supports light/dark via `next-themes` (`.dark` class on
> `<html>`) over shadcn CSS-variable tokens (`globals.css`). Neutral colors **must** use the
> semantic tokens so both themes work — never the fixed brand-black/white-alpha/brand-gray
> classes. The `src/components/ui/**` primitives and shared `common/` components already use
> tokens; build on them. `text-white` is allowed **only** for text sitting on a solid colored
> background (e.g. a `bg-brand-purple` button, a colored badge/avatar).

> **Reuse first:** before writing UI markup, check `src/components/common/` (e.g. `PageHeader`,
> `StatCard`, `StatusBadge`, `EmptyState`, `DashboardCard`, `ConfirmDialog`, `OrderCard`) and the
> typography primitives in `src/components/common/typography.tsx` (`Heading`, `Text`). Don't
> re-implement a card/header/badge/empty-state inline when a shared component already exists —
> extend the shared one instead.

---

## Colors

### Theme tokens (neutrals — use these, they adapt to light/dark)

| Token class | Use |
|-------------|-----|
| `bg-background` / `text-foreground` | Page background + primary text |
| `bg-card` / `text-card-foreground` | Cards, sidebars, elevated surfaces, inputs |
| `bg-popover` / `text-popover-foreground` | Dropdowns, tooltips, select/menu content |
| `bg-muted` / `text-muted-foreground` | Subtle panels, tab strips; secondary/muted text & placeholders |
| `bg-secondary` / `text-secondary-foreground` | Secondary button surface |
| `border-border` | Default card/separator border |
| `border-input` | Form-field border |

> Dark values map to the old palette (`bg-card`/`bg-popover` ≈ `#1A1A1A`, `bg-background` ≈
> `#0A0A0A`), so dark mode looks the same; light values come from the shadcn `:root` tokens.

### Backgrounds (legacy — do NOT use for surfaces; they don't theme-switch)

| Class | Replaced by |
|-------|-------------|
| ~~`bg-brand-black`~~ | `bg-background` |
| ~~`bg-brand-black-light`~~ | `bg-card` (or `bg-muted` for subtle panels) |
| ~~`bg-black/20`, `bg-black/30`~~ | `bg-muted/40`, `bg-muted/60` |

### Purple (Brand)

| Class | Hex | Use |
|-------|-----|-----|
| `bg-brand-purple` / `text-brand-purple` | `#7C3AED` | Primary buttons, key accents |
| `bg-brand-purple-light` / `text-brand-purple-light` | `#A855F7` | Hover states, secondary accents |
| `bg-brand-purple-dark` / `text-brand-purple-dark` | `#4C1D95` | Strong CTAs, deep backgrounds |
| `text-brand-purple-lighter` | `#C084FC` | Subtle purple text |
| `border-brand-purple` | `#7C3AED` | Focus borders, active borders |

### Text

| Class | Use |
|-------|-----|
| `text-foreground` | Primary text, headings |
| `text-muted-foreground` | Secondary text, descriptions, muted/placeholder/disabled |
| `text-white` | **Only** text on a solid colored bg (purple/red/green button, colored badge/avatar) |

> ~~`text-brand-gray-300/400/500`~~ no longer used for body text → `text-muted-foreground`.

### Status (use standard Tailwind)

| Use | Background | Text | Border |
|-----|-----------|------|--------|
| Success | `bg-green-500/20` | `text-green-300` | `border-green-500/50` |
| Warning | `bg-yellow-500/20` | `text-yellow-300` | `border-yellow-500/50` |
| Error | `bg-red-500/20` | `text-red-300` | `border-red-500/50` |
| Info | `bg-brand-purple/20` | `text-brand-purple-light` | `border-brand-purple/50` |

### Red (brand red — use for destructive actions)

| Class | Hex | Use |
|-------|-----|-----|
| `bg-brand-red` / `text-brand-red` | `#DC2626` | Danger buttons, error text |

---

## Borders

| Class | Use |
|-------|-----|
| `border-border` | Default card/separator border (replaces ~~`border-white/10`~~ / ~~`border-white/5`~~) |
| `border-input` | Form-field border |
| `border-brand-purple` | Focus state, active state |
| `border-brand-purple/50` | Hover state on cards |
| `border-brand-purple/20` | Subtle purple border |

---

## Typography

| Font | Class | Use |
|------|-------|-----|
| Orbitron | `font-orbitron` | Page titles, headings |
| Rajdhani | `font-rajdhani` | Labels, UI elements, descriptions |
| System | `font-sans` | Body text, long-form content |

**Prefer the typography primitives over raw font classes.** Use `<Heading>` and `<Text>`
from `@/components/common/typography` for standalone headings/paragraphs — they apply the
brand font once. The shadcn `CardTitle`, `DialogTitle`, `AlertDialogTitle`, and `AlertTitle`
**already carry `font-orbitron`**, and `CardDescription`/`DialogDescription` already carry
`font-rajdhani text-muted-foreground` — don't re-add those classes on them.

**Never add an inline `style={{ fontFamily: ... }}` fallback.** Fonts are loaded by
`next/font` in `src/app/layout.tsx` (with `display:'swap'` + `preload`) and exposed via the
`font-orbitron` / `font-rajdhani` Tailwind classes (mapped to the CSS vars in
`tailwind.config.js`). The old inline fallback named a system font, not the loaded face, so it
silently degraded rendering. The Tailwind class alone is correct and sufficient.

Font weights: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700).

---

## Component Patterns

**Always use shadcn/ui components from `@/components/ui`** — never raw `<button>`, `<input>`, etc. Apply brand styling via the `className` prop (merged through `cn`). The base variants already carry the brand palette; add classes only for cases the variants don't cover.

### Card

```tsx
import { Card, CardContent } from '@/components/ui/card'

<Card className="hover:border-brand-purple/50 transition-colors">
  <CardContent>Content</CardContent>
</Card>
```

**Glassmorphism variant** — add the glass classes via `className`:
```tsx
<Card className="bg-background/30 backdrop-blur-md border-brand-purple/50">
  <CardContent>Content</CardContent>
</Card>
```

### Buttons

```tsx
import { Button } from '@/components/ui/button'

{/* Primary — `default` variant is already bg-brand-purple with glow */}
<Button>Button Label</Button>

{/* Danger — `destructive` variant is already bg-brand-red */}
<Button variant="destructive">Delete</Button>
```

### Input

```tsx
import { Input } from '@/components/ui/input'

<Input placeholder="..." />
```

### Status Badge

Use `<Badge>` from `@/components/ui/badge` with status classes via `className`:

```tsx
import { Badge } from '@/components/ui/badge'

<Badge className="bg-green-500/20 text-green-300 border-green-500/50">Active</Badge>       {/* Success */}
<Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Pending</Badge>  {/* Warning */}
<Badge className="bg-red-500/20 text-red-300 border-red-500/50">Failed</Badge>            {/* Error */}
<Badge className="bg-brand-purple/20 text-brand-purple-light border-brand-purple/50">In Progress</Badge> {/* Info */}
```

Need a component you don't have yet? Add it with `npx shadcn@latest add <name>` — never hand-roll a raw element.

---

## Spacing & Layout

| Pattern | Class | Use |
|---------|-------|-----|
| Page container | `container mx-auto px-4` | Top-level page wrapper |
| Card padding | `p-6` | Standard card interior |
| Section gap | `gap-4`, `gap-8` | Between cards/sections |
| Large section | `py-12`, `py-20` | Hero/section vertical spacing |

---

## Effects

### Glow Shadows

| Class | Use |
|-------|-----|
| `shadow-glow-sm` | Subtle glow (10px, 0.3 opacity) |
| `shadow-glow` | Standard glow (20px, 0.5 opacity) |
| `shadow-glow-lg` | Large glow (30px, 0.7 opacity) |

### CSS Utility Classes (defined in globals.css)

| Class | Effect |
|-------|--------|
| `.hover-glow` | Purple glow on hover |
| `.hover-lift` | Card floats up on hover |
| `.animate-glow` | Pulsing purple glow animation |
| `.bg-gradient-brand` | `#0A0A0A → #1A1A1A → #4C1D95` diagonal gradient |
| `.bg-gradient-red` | Red gradient (danger zones) |
| `.card-interactive` | Combines hover-lift + hover-glow |
| `.focus-ring` | Accessible focus ring (purple) |
| `.shimmer` | Loading shimmer animation |

---

## Loading States (Suspense & Skeleton)

Two consistent loading patterns — don't hand-roll spinners or `"Carregando..."` divs.

**Auth gating & Suspense fallbacks → `LoadingSpinner`** (`@/components/common/loading-spinner`):
- Route-level auth guard: `if (authLoading) return <LoadingSpinner />`.
- `<Suspense>` fallback (pages using `useSearchParams`): `fallback={<LoadingSpinner />}` at the
  top level, or `fallback={<LoadingSpinner fullScreen={false} />}` when the `<Suspense>` is
  already nested inside a page shell. Use `Spinner` for tiny inline cases (inside a button).

**Content / data loading → Skeletons** (`@/components/common/skeletons`): render the skeleton
that matches the content it replaces, so layout doesn't shift:
`SkeletonStatsGrid` (pass `count`/`columns` to mirror the real `StatsGrid`), `SkeletonOrdersList`,
`SkeletonTable`, `SkeletonProfileCard`, `SkeletonForm`, etc.

Skeleton surfaces use the **flat default `Card`** (`bg-card` + `border-border`) and the
shimmer `Skeleton` primitive — never the old purple-glass surface.

---

## Touch Targets (Mobile)

| Class | Size | Use |
|-------|------|-----|
| `min-h-touch` | 44px | iOS recommended touch target |
| `min-h-touch-lg` | 48px | Android recommended touch target |

---

## Responsive Breakpoints

| Name | Size | Use |
|------|------|-----|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` / `notebook` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `desktop` | 1366px | Standard desktops |
| `wide` | 1920px | Large displays |

---

## What NOT To Use

These patterns are removed and must never be reintroduced:

| ❌ Don't use | ✅ Use instead |
|-------------|---------------|
| `bg-brand-black` (page/surface) | `bg-background` |
| `bg-brand-black-light` | `bg-card` (or `bg-muted` for subtle panels) |
| `bg-black/20` / `bg-black/30` | `bg-muted/40` / `bg-muted/60` |
| `text-white` (as body text) | `text-foreground` (keep `text-white` only on a solid colored bg) |
| `text-brand-gray-300` / `-400` / `-500` | `text-muted-foreground` |
| `border-white/10` / `border-white/5` | `border-border` |
| `bg-surface-*` / `text-primary` / `text-secondary` / `text-muted` | the matching theme token |
| `bg-action-primary` | `bg-brand-purple` (or the `Button` `default` variant) |
| `bg-action-danger` | `bg-brand-red` (or `Button` `destructive`) |
| `text-brand` | `text-brand-purple` |
| `#7C3AED` (hardcoded hex) | `brand-purple` |
| `bg-[var(--surface-card)]` | `bg-card` |
| `text-gray-300` / `-400` / `-500` | `text-muted-foreground` |
| `bg-gray-800` / `bg-gray-900` | `bg-card` / `bg-muted` |
| `border-gray-700` | `border-border` |
| inline `style={{ fontFamily: 'Orbitron…' }}` | `font-orbitron` class alone |

> **Grays:** `brand.gray.*` has the **same hex** as Tailwind `gray.*`, so the rename is
> visually identical — but always use the `brand-gray-*` form so the palette is auditable and
> the design-system guard can enforce it. Raw `text-gray-*` / `bg-gray-*` are forbidden in JSX.

> **Enforcement:** `npm run lint` runs `next lint` **and** the design-system guard
> (`scripts/check-design-system.mjs`, also `npm run lint:ds`). The guard fails the build on raw
> `gray-*`, the legacy token classes above, the **fixed neutral classes that don't theme-switch**
> (`bg-brand-black`, `bg-brand-black-light`, `border-white/5|10`, `text-brand-gray-300|400|500`,
> `bg-black/20|30`), inline `fontFamily` fallbacks, and hex in `className`. Vendored
> `src/components/ui/**` and the documented exception files are skipped.

---

## Glow Drop-Shadows (text & icons)

`shadow-glow*` are **box-shadows** — correct for cards/containers, wrong for glowing **text or SVG icons** (they draw a glow around the bounding box, not the glyph). For text/icon glow use the **drop-shadow filter** utilities (defined in `tailwind.config.js` → `dropShadow`):

| Class | Use |
|-------|-----|
| `drop-shadow-glow-sm` | Subtle icon glow (e.g. active nav icon) |
| `drop-shadow-glow` | Standard text/icon glow |
| `drop-shadow-glow-lg` | Large hero title glow |

❌ Never `drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]` (arbitrary) → ✅ `drop-shadow-glow-lg`.

---

## Exceptions — NOT design-system violations

The Golden Rule (no hex, no arbitrary values) applies to **Tailwind-rendered JSX**. The following are legitimate and must **not** be "fixed" into brand classes:

1. **HTML email templates** (`src/lib/email.ts`, `src/services/verification.service.ts`).
   Email clients do not support Tailwind/external CSS reliably — inline `style` and `<style>` with **hex** are mandatory. Use the brand palette **as hex values** (`#7C3AED`, `#A855F7`, `#1A1A1A`, etc.) so emails stay on-brand. Keep colors near the top of the template for easy auditing.

2. **Chart / SVG libraries (Recharts)** (`src/app/admin/page.tsx`, `src/app/api/admin/charts/route.ts`).
   Recharts takes colors via **JS props** (`stroke`, `fill`, `stopColor`) and tooltip style objects — it cannot consume Tailwind classes. Use brand **hex** values, ideally centralized in a constant (e.g. `TOOLTIP_STYLE`) or returned from the API, not scattered inline.

3. **Data-driven colors** — `style={{ backgroundColor: item.color }}` where `color` comes from the backend/DB (e.g. status-chart segments). Acceptable; ensure the source values are brand-aligned.

4. **Unit-less arbitrary values with no token equivalent** — viewport/percentage/`calc` sizing such as `h-[85vh]` (dialog height), `max-w-[75%]` (chat bubble), `h-[calc(100%-140px)]`, and micro-badge sizes (`text-[10px]`, `min-w-[18px]` for notification counts). Prefer a token when one exists (`w-[200px]` → `w-52`); keep the arbitrary value only when no token fits, and keep it rare.

> **Tables:** the shadcn `table.tsx` primitive uses theme tokens (`text-muted-foreground`,
> `border-border`, `bg-muted` footer) plus a brand-purple row hover (`hover:bg-brand-purple/5`).
> Keep new tables on the tokens + brand-purple accent — don't hardcode neutral brand classes.
