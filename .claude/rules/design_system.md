# Design System — FlautasBoost

**Single source of truth for all styling decisions.**

> **Golden Rule:** NEVER use hexadecimal values (`#7C3AED`), CSS token classes (`bg-surface-card`, `text-primary`, `bg-action-primary`), or arbitrary Tailwind values. ALWAYS use brand palette classes.

---

## Colors

### Backgrounds

| Class | Hex | Use |
|-------|-----|-----|
| `bg-brand-black` | `#0A0A0A` | Page backgrounds, body |
| `bg-brand-black-light` | `#1A1A1A` | Cards, sidebars, elevated surfaces, modals |
| `bg-brand-black/50` | `#0A0A0A` 50% | Subtle overlay backgrounds |

### Purple (Brand)

| Class | Hex | Use |
|-------|-----|-----|
| `bg-brand-purple` / `text-brand-purple` | `#7C3AED` | Primary buttons, key accents |
| `bg-brand-purple-light` / `text-brand-purple-light` | `#A855F7` | Hover states, secondary accents |
| `bg-brand-purple-dark` / `text-brand-purple-dark` | `#4C1D95` | Strong CTAs, deep backgrounds |
| `text-brand-purple-lighter` | `#C084FC` | Subtle purple text |
| `border-brand-purple` | `#7C3AED` | Focus borders, active borders |

### Text

| Class | Hex | Use |
|-------|-----|-----|
| `text-white` | `#FFFFFF` | Primary text, headings |
| `text-brand-gray-300` | `#D1D5DB` | Secondary text, descriptions |
| `text-brand-gray-400` | `#9CA3AF` | Muted text |
| `text-brand-gray-500` | `#6B7280` | Placeholders, disabled text |

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
| `border-white/10` | Default card/input border |
| `border-white/5` | Very subtle separator |
| `border-brand-purple` | Focus state, active state |
| `border-brand-purple/50` | Hover state on cards |
| `border-brand-purple/20` | Subtle purple border |

---

## Typography

| Font | Class | `style` fallback | Use |
|------|-------|-----------------|-----|
| Orbitron | `font-orbitron` | `style={{ fontFamily: 'Orbitron, sans-serif' }}` | Page titles, headings |
| Rajdhani | `font-rajdhani` | `style={{ fontFamily: 'Rajdhani, sans-serif' }}` | Labels, UI elements, descriptions |
| System | `font-sans` | — | Body text, long-form content |

**Important:** Always add the inline `style` attribute alongside `font-orbitron` and `font-rajdhani` to ensure correct rendering if the CSS variable hasn't loaded.

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
<Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
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
| `bg-action-danger` | `bg-brand-red` |
| `bg-action-strong` | `bg-brand-purple-dark` |
| `border-border-default` | `border-white/10` |
| `border-border-brand` | `border-brand-purple` |
| `#7C3AED` (hardcoded hex) | `brand-purple` |
| `bg-[var(--surface-card)]` | `bg-brand-black-light` |
