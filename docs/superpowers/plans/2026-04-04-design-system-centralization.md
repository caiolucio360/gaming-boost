# Design System Centralization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the CSS-variable token system (`bg-surface-*`, `bg-action-*`, `text-primary`, etc.) from tailwind.config.js and globals.css, fix the two remaining token usages in source code, then consolidate all design system documentation into two files.

**Architecture:** The brand palette (`bg-brand-black`, `bg-brand-purple`, etc.) already works reliably with Tailwind v4 and is used by all application code. Only the configuration declarations and two isolated usages need to change. No page or component migrations are needed — all app code already uses brand palette.

**Tech Stack:** Tailwind CSS v4, Next.js 15 App Router, TypeScript

---

## File Map

| File | Change |
|------|--------|
| `tailwind.config.js` | Remove 5 token sections (lines 42–81): `surface`, `action`, `text`, `status`, `border-ds` |
| `src/app/globals.css` | Remove custom token CSS variables (light + dark mode blocks), fix `var(--action-primary)` reference |
| `src/components/ui/skeleton.tsx` | Replace `action-primary` → `brand-purple` (1 line) |
| `docs/design_system.md` | Rewrite as complete brand-palette-only reference |
| `CLAUDE.md` | Remove stale CSS token section, update design system quick reference |
| `.agent/rules/designsystem.md` | Delete (replaced by `docs/design_system.md`) |

---

### Task 1: Remove CSS token sections from tailwind.config.js

**Files:**
- Modify: `tailwind.config.js` lines 37–81

- [ ] **Step 1: Open tailwind.config.js and verify current state**

  Run: `grep -n "surface\|action\|border-ds\|status\|text:" tailwind.config.js`
  
  Expected output should show the 5 token sections at lines ~43–81 that need removal.

- [ ] **Step 2: Remove the 5 CSS token sections**

  Replace the `colors` object content to remove everything between the start of the colors block and the brand palette. The result should be:

  ```js
  colors: {
    // =============================================
    // BRAND PALETTE
    // =============================================
    brand: {
      black: '#0A0A0A',
      'black-light': '#1A1A1A',
      red: {
        DEFAULT: '#DC2626',
        light: '#EF4444',
        dark: '#B91C1C',
      },
      purple: {
        dark: '#4C1D95',
        DEFAULT: '#7C3AED',
        light: '#A855F7',
        lighter: '#C084FC',
      },
      white: '#FFFFFF',
      gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
      }
    },

    // =============================================
    // SHADCN/UI COMPATIBILITY TOKENS
    // =============================================
    border: "hsl(var(--border))",
    input: "hsl(var(--input))",
    ring: "hsl(var(--ring))",
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    primary: {
      DEFAULT: "hsl(var(--primary))",
      foreground: "hsl(var(--primary-foreground))",
    },
    secondary: {
      DEFAULT: "hsl(var(--secondary))",
      foreground: "hsl(var(--secondary-foreground))",
    },
    destructive: {
      DEFAULT: "hsl(var(--destructive))",
      foreground: "hsl(var(--destructive-foreground))",
    },
    muted: {
      DEFAULT: "hsl(var(--muted))",
      foreground: "hsl(var(--muted-foreground))",
    },
    accent: {
      DEFAULT: "hsl(var(--accent))",
      foreground: "hsl(var(--accent-foreground))",
    },
    popover: {
      DEFAULT: "hsl(var(--popover))",
      foreground: "hsl(var(--popover-foreground))",
    },
    card: {
      DEFAULT: "hsl(var(--card))",
      foreground: "hsl(var(--card-foreground))",
    },
  },
  ```

- [ ] **Step 3: Verify no token references remain in tailwind.config.js**

  Run: `grep -n "surface\|action-\|'text':\|status:\|border-ds" tailwind.config.js`
  
  Expected: no output (empty).

- [ ] **Step 4: Commit**

  ```bash
  git add tailwind.config.js
  git commit -m "refactor: remove CSS token sections from tailwind config"
  ```

---

### Task 2: Remove CSS token variables from globals.css

**Files:**
- Modify: `src/app/globals.css` lines 30–124, 610

- [ ] **Step 1: Remove custom token variable block from the `:root` section (light mode)**

  In `src/app/globals.css`, remove lines 30–64 (the entire design system semantic tokens block in `:root`):

  ```css
  /* =============================================
     DESIGN SYSTEM SEMANTIC TOKENS (Light Mode)
     Docs: docs/design_system.md
     ============================================= */

  /* Surface tokens (backgrounds) */
  --surface-page: #FFFFFF;
  --surface-section: #F9FAFB;
  --surface-card: #FFFFFF;
  --surface-subtle: #F3F4F6;
  --surface-elevated: #FFFFFF;

  /* Action tokens (buttons, interactive) */
  --action-primary: #7C3AED;
  --action-primary-hover: #A855F7;
  --action-secondary: transparent;
  --action-strong: #4C1D95;
  --action-danger: #DC2626;

  /* Text tokens */
  --text-primary: #111827;
  --text-secondary: #4B5563;
  --text-muted: #9CA3AF;
  --text-on-brand: #FFFFFF;
  --text-brand: #7C3AED;

  /* Status tokens */
  --status-success: #10B981;
  --status-warning: #F59E0B;
  --status-error: #DC2626;

  /* Border tokens */
  --border-default: #E5E7EB;
  --border-brand: #7C3AED;
  ```

  Delete this entire block so `:root` ends with `--radius: 0.5rem;` followed immediately by `}`.

- [ ] **Step 2: Remove custom token variable block from the `.dark` section**

  In `src/app/globals.css`, remove lines 90–124 (the design system semantic tokens block in `.dark`):

  ```css
  /* =============================================
     DESIGN SYSTEM SEMANTIC TOKENS (Dark Mode)
     Docs: docs/design_system.md
     ============================================= */

  /* Surface tokens (backgrounds) */
  --surface-page: #0A0A0A;
  --surface-section: #0A0A0A;
  --surface-card: #1A1A1A;
  --surface-subtle: #27272a;
  --surface-elevated: #1A1A1A;

  /* Action tokens (buttons, interactive) */
  --action-primary: #7C3AED;
  --action-primary-hover: #A855F7;
  --action-secondary: transparent;
  --action-strong: #4C1D95;
  --action-danger: #DC2626;

  /* Text tokens */
  --text-primary: #FFFFFF;
  --text-secondary: #D1D5DB;
  --text-muted: #6B7280;
  --text-on-brand: #FFFFFF;
  --text-brand: #7C3AED;

  /* Status tokens */
  --status-success: #10B981;
  --status-warning: #F59E0B;
  --status-error: #DC2626;

  /* Border tokens */
  --border-default: #27272a;
  --border-brand: #7C3AED;
  ```

  Delete this entire block so `.dark` ends with `--ring: 262 83% 58%;` followed immediately by `}`.

- [ ] **Step 3: Fix the .focus-ring rule that references var(--action-primary)**

  Find in `globals.css`:
  ```css
  .focus-ring:focus-visible {
    outline: 2px solid var(--action-primary);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2);
  }
  ```

  Replace with:
  ```css
  .focus-ring:focus-visible {
    outline: 2px solid #7C3AED;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2);
  }
  ```

- [ ] **Step 4: Verify no remaining custom token variable usages**

  Run: `grep -n "var(--surface\|var(--action\|var(--text-\|var(--status\|var(--border-default\|var(--border-brand" src/app/globals.css`
  
  Expected: no output (empty). The only remaining `var()` calls should be for shadcn/ui tokens (`var(--border)`, `var(--background)`, etc.).

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/globals.css
  git commit -m "refactor: remove CSS token variables from globals.css"
  ```

---

### Task 3: Fix skeleton.tsx — replace action-primary token

**Files:**
- Modify: `src/components/ui/skeleton.tsx` line 10

- [ ] **Step 1: Fix the Skeleton component gradient classes**

  In `src/components/ui/skeleton.tsx`, change line 10 from:
  ```tsx
  "rounded-md bg-gradient-to-r from-action-primary/10 via-action-primary/20 to-action-primary/10 bg-[length:200%_100%] animate-shimmer",
  ```

  To:
  ```tsx
  "rounded-md bg-gradient-to-r from-brand-purple/10 via-brand-purple/20 to-brand-purple/10 bg-[length:200%_100%] animate-shimmer",
  ```

- [ ] **Step 2: Verify build compiles cleanly**

  Run: `npm run build`
  
  Expected: build completes with no TypeScript errors and no Tailwind warnings about unknown classes. The skeleton shimmer will still appear as a subtle purple gradient.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/ui/skeleton.tsx
  git commit -m "fix: replace action-primary token with brand-purple in skeleton"
  ```

---

### Task 4: Rewrite docs/design_system.md

**Files:**
- Modify: `docs/design_system.md` (full rewrite)

- [ ] **Step 1: Rewrite docs/design_system.md as the complete brand-palette reference**

  Replace the entire file content with:

  ````markdown
  # Design System — GameBoost

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
  | `text-brand-red` | `#DC2626` | Inline error messages |

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

  ### Card

  ```tsx
  <div className="bg-brand-black-light border border-white/10 rounded-xl p-6 hover:border-brand-purple/50 transition-colors">
    Content
  </div>
  ```

  **Glassmorphism variant:**
  ```tsx
  <div className="bg-brand-black/30 backdrop-blur-md border border-brand-purple/50 rounded-xl p-6">
    Content
  </div>
  ```

  ### Primary Button

  ```tsx
  <button className="bg-brand-purple hover:bg-brand-purple-light text-white font-bold py-3 px-6 rounded-lg transition-all shadow-glow hover:shadow-glow-lg">
    Button Label
  </button>
  ```

  ### Danger Button

  ```tsx
  <button className="bg-brand-red hover:bg-brand-red-light text-white font-bold py-3 px-6 rounded-lg transition-all">
    Delete
  </button>
  ```

  ### Input

  ```tsx
  <input className="bg-brand-black-light border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-brand-gray-500 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none transition-all" />
  ```

  ### Status Badge

  ```tsx
  {/* Success */}
  <span className="bg-green-500/20 text-green-300 border border-green-500/50 px-2 py-1 rounded text-xs font-medium">
    Active
  </span>

  {/* Warning */}
  <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 px-2 py-1 rounded text-xs font-medium">
    Pending
  </span>

  {/* Error */}
  <span className="bg-red-500/20 text-red-300 border border-red-500/50 px-2 py-1 rounded text-xs font-medium">
    Failed
  </span>

  {/* Info / Brand */}
  <span className="bg-brand-purple/20 text-brand-purple-light border border-brand-purple/50 px-2 py-1 rounded text-xs font-medium">
    In Progress
  </span>
  ```

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
  | `bg-action-danger` | `bg-brand-red` or `bg-red-600` |
  | `bg-action-strong` | `bg-brand-purple-dark` |
  | `border-border-default` | `border-white/10` |
  | `border-border-brand` | `border-brand-purple` |
  | `#7C3AED` (hardcoded hex) | `brand-purple` |
  | `bg-[var(--surface-card)]` | `bg-brand-black-light` |
  ````

- [ ] **Step 2: Commit**

  ```bash
  git add docs/design_system.md
  git commit -m "docs: rewrite design_system.md as brand-palette-only reference"
  ```

---

### Task 5: Update CLAUDE.md and delete duplicate design doc

**Files:**
- Modify: `CLAUDE.md` lines 738–775 (remove CSS token section, add quick reference)
- Delete: `.agent/rules/designsystem.md`

- [ ] **Step 1: Remove the stale CSS token section from CLAUDE.md**

  In `CLAUDE.md`, find and delete the section titled `### CSS Variable Semantic Tokens (CAUTION)` and everything through its closing code block and explanatory paragraph (~lines 738–780). This section describes the old token system which no longer exists.

  The section to remove starts with:
  ```
  ### CSS Variable Semantic Tokens (CAUTION)

  The design system includes semantic tokens defined in `globals.css`:
  ```
  ...and ends with the paragraph that says "Prefer brand palette classes instead".

- [ ] **Step 2: Update the Brand Palette section header in CLAUDE.md**

  Find:
  ```
  ### Brand Palette (RECOMMENDED)

  Use these brand palette classes throughout the codebase. They work reliably with Tailwind v4.
  ```

  Replace with:
  ```
  ### Brand Palette (THE ONLY SYSTEM)

  This is the only color system. CSS variable tokens (`bg-surface-*`, `bg-action-*`, etc.) are removed. Always use brand palette classes — they work reliably with Tailwind v4.
  ```

- [ ] **Step 3: Add a Quick Reference block after the Color Mapping Reference section**

  After the `### Color Mapping Reference` table (which ends around `| gray-300 | brand-gray-300 |`), add:

  ```markdown
  ### Quick Reference — What to Use

  **Backgrounds:** `bg-brand-black` (page), `bg-brand-black-light` (cards/modals)

  **Purple:** `bg-brand-purple` (buttons), `hover:bg-brand-purple-light` (hover), `bg-brand-purple-dark` (strong CTAs), `border-brand-purple` (focus/active)

  **Text:** `text-white` (primary), `text-brand-gray-300` (secondary), `text-brand-gray-500` (muted), `text-brand-purple` (accent/links)

  **Borders:** `border-white/10` (default), `border-brand-purple` (focus/active), `border-brand-purple/50` (hover)

  **Status:** `bg-green-500/20 text-green-300` (success), `bg-yellow-500/20 text-yellow-300` (warning), `bg-red-500/20 text-red-300` (error)

  **Effects:** `shadow-glow` / `shadow-glow-lg`, `.hover-glow`, `.animate-glow`, `.bg-gradient-brand`

  **Fonts:** `font-orbitron` + `style={{ fontFamily: 'Orbitron, sans-serif' }}` (titles), `font-rajdhani` (labels/UI)

  Full reference: `docs/design_system.md`
  ```

- [ ] **Step 4: Delete the duplicate design system rule file**

  Run:
  ```bash
  git rm .agent/rules/designsystem.md
  ```

- [ ] **Step 5: Verify build still passes**

  Run: `npm run build`
  
  Expected: Build completes with zero TypeScript errors. The skeleton shimmer renders as a subtle purple gradient. No missing class warnings.

- [ ] **Step 6: Commit everything**

  ```bash
  git add CLAUDE.md
  git commit -m "docs: update CLAUDE.md design system reference, remove stale token docs"
  ```

---

## Verification Checklist

After all tasks are complete:

- [ ] `grep -r "bg-surface-\|bg-action-\|border-border-\|text-on-brand\b" src/ --include="*.tsx" --include="*.ts"` → empty output
- [ ] `grep -n "surface\|action:\|border-ds\|'text':" tailwind.config.js` → empty output  
- [ ] `grep -n "var(--surface\|var(--action\|var(--status\|var(--border-default\|var(--border-brand" src/app/globals.css` → empty output
- [ ] `npm run build` → passes with zero errors
- [ ] `ls .agent/rules/designsystem.md` → "No such file"
- [ ] `head -5 docs/design_system.md` → shows "Design System — GameBoost" (new content)
