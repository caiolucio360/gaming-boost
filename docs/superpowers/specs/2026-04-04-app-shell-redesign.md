# App Shell Redesign — Design Spec
**Date:** 2026-04-04  
**Status:** Approved

---

## Problem

All three dashboard areas (admin, booster, client) share the same public marketing header. This creates three issues:

1. **No persistent navigation for admin** — moving between the 7+ admin sections requires going back to `/admin` and clicking link cards. The dashboard page is effectively a navigation menu, not a dashboard.
2. **No visual distinction between "app" and "site"** — admin and booster pages look identical to marketing pages. There is no "you are in the control panel" signal.
3. **Booster navigation is implicit** — the only link between `/booster` (dashboard) and `/booster/payments` is a button at the top of the page. Stat cards double as tab switchers, which is confusing.

---

## Scope

- **Admin**: new app shell (sidebar + top bar) replacing the public header
- **Booster**: new app shell (sidebar + top bar) replacing the public header
- **Client**: no shell change — stays in the public header; two minor UX improvements

---

## Solution

### 1. Shared `AppShell` Component

**File:** `src/components/layout/app-shell.tsx`

A single reusable shell component that both admin and booster layouts instantiate. Accepts:

```tsx
interface AppShellProps {
  role: 'ADMIN' | 'BOOSTER'
  navItems: NavItem[]
  children: React.ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean      // match exactly (for dashboard root)
  external?: boolean   // opens in new tab
  separator?: boolean  // renders a divider above this item
}
```

**Layout structure:**

```
┌─────────────────────────────────────────────────────┐
│ SIDEBAR (240px)  │  TOP BAR                          │
│                  │─────────────────────────────────── │
│  Logo + Badge    │  [Hamburger] Page Title  [Bell][👤]│
│  ─────────────   │                                    │
│  Nav items       │  CONTENT AREA                      │
│  (icon + label)  │  (bg-brand-black, padded)          │
│                  │                                    │
│  [separator]     │                                    │
│  Preview Site    │                                    │
│  ─────────────   │                                    │
│  Avatar          │                                    │
│  Name / email    │                                    │
│  [Sair]          │                                    │
└─────────────────────────────────────────────────────┘
```

**Sidebar states:**
- **Open (default desktop):** 240px, icon + label visible
- **Collapsed (desktop toggle):** 64px, icon only, labels hidden, tooltips on hover
- **Mobile:** hidden by default, slides in as a full-height drawer overlay from the left when hamburger is tapped; backdrop overlay dismisses it

**Sidebar header:**
- GameBoost logo (text or existing logo component)
- Role badge below: "ADMIN" in `bg-brand-purple/20 text-brand-purple-light border-brand-purple/30` or "BOOSTER" in `bg-amber-500/20 text-amber-400 border-amber-500/30`

**Nav item active state:**
- Active: `bg-brand-purple/20 text-brand-purple-light border-l-2 border-brand-purple`
- Inactive: `text-brand-gray-400 hover:text-white hover:bg-white/5`
- Detection via `usePathname()` — exact match for root pages, `startsWith` for section pages

**Top bar:**
- Left: collapse toggle (desktop) / hamburger (mobile)
- Center: current page title derived from a `pageTitle` prop passed by each page, or via a context
- Right: `NotificationBell` component + user avatar chip (name initial in a circle)

**Sidebar bottom section:**
- User avatar initial in a circle (`bg-brand-purple/30`)
- Name (truncated) + email (truncated, smaller)
- "Sair" button with `LogOut` icon

**Collapse persistence:**
- Sidebar open/collapsed state stored in `localStorage` key `app-shell-collapsed`
- Restored on mount

---

### 2. Admin Layout

**File:** `src/app/admin/layout.tsx`

Becomes a real layout that renders `<AppShell role="ADMIN" navItems={adminNavItems}>`:

```tsx
const adminNavItems: NavItem[] = [
  { label: 'Dashboard',     href: '/admin',              icon: LayoutDashboard, exact: true },
  { label: 'Pedidos',       href: '/admin/orders',       icon: ShoppingCart },
  { label: 'Usuários',      href: '/admin/users',        icon: Users },
  { label: 'Boosters',      href: '/admin/boosters',     icon: Shield },
  { label: 'Precificação',  href: '/admin/pricing',      icon: SlidersHorizontal },
  { label: 'Pagamentos',    href: '/admin/payments',     icon: CreditCard },
  { label: 'Comissões',     href: '/admin/commissions',  icon: Percent },
  { separator: true,
    label: 'Preview do Site', href: '/games/cs2',        icon: ExternalLink, external: true },
]
```

The layout wraps children in AppShell and passes a `pageTitle` via React Context so each page can set its own title in the top bar.

**Admin Dashboard page (`/admin`) changes:**
- Remove the action-card navigation grid (7 link cards) — navigation is now in the sidebar
- Keep: stats grid (4 cards: usuarios, pedidos, receita, dev revenue)
- Add: recent orders table (already exists, just promote it)
- Add: "Pedidos aguardando booster" alert if any PAID orders have no booster assigned

**Content area padding:**
- Remove per-page `py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl mx-auto` wrappers
- Move consistent padding into the AppShell content area: `p-6 lg:p-8 max-w-7xl mx-auto`
- Each admin page becomes a clean content component without outer wrapper boilerplate

---

### 3. Booster Layout

**File:** `src/app/booster/layout.tsx`

Renders `<AppShell role="BOOSTER" navItems={boosterNavItems}>`:

```tsx
const boosterNavItems: NavItem[] = [
  { label: 'Meus Trabalhos', href: '/booster',          icon: Briefcase, exact: true },
  { label: 'Pagamentos',     href: '/booster/payments', icon: DollarSign },
  { label: 'Meu Perfil',     href: '/profile',          icon: User },
]
```

**Booster Dashboard page (`/booster`) changes:**
- Stat cards (Disponíveis / Em Andamento / Concluídos / Ganhos / Taxa) become **pure display stats** — non-clickable
- Add a `<Tabs>` bar (using the existing `Tabs` component) directly above the order list:
  - Tabs: Disponíveis | Em Andamento | Concluídos
  - Replaces the current "click stat card to switch view" implicit pattern
- Remove the "Ver Meus Pagamentos" button at the top — it's now in the sidebar
- Stat cards remain in a grid above the tabs (just stats, no onClick)

---

### 4. Client — Minor Improvements

No shell change. Two small fixes:

1. **Dashboard filter buttons** (`/dashboard`): wrap in `overflow-x-auto` scrollable row so they don't wrap awkwardly on medium-width screens. Add `flex-nowrap` and `pb-1` for scroll handle visibility.

2. **Notification bell on desktop**: already present in the public header's `elojob-header.tsx` for logged-in users. Verify it renders on desktop (currently may be hidden on larger breakpoints) — no new component needed, just a className fix if missing.

---

## Files Created / Modified

| File | Change |
|------|--------|
| `src/components/layout/app-shell.tsx` | New — shared shell component |
| `src/app/admin/layout.tsx` | Becomes real layout with AppShell |
| `src/app/booster/layout.tsx` | Becomes real layout with AppShell |
| `src/app/admin/page.tsx` | Remove nav cards, keep stats + recent orders |
| `src/app/booster/page.tsx` | Make stat cards non-clickable; add Tabs bar |
| `src/app/dashboard/page.tsx` | Scrollable filter row |
| `src/components/layout/elojob-header.tsx` | Verify notification bell visibility on desktop |

---

## What Does NOT Change

- Public marketing pages (`/`, `/games/cs2`, `/how-it-works`, etc.)
- Client dashboard layout shell (stays in public header)
- Mobile bottom nav for public/client pages
- All page content — only the wrapper/navigation shell changes
- Auth pages (`/login`, `/register`, etc.)

---

## Design Tokens

Sidebar uses existing brand palette exclusively:
- Background: `bg-brand-black-light` (sidebar) / `bg-brand-black` (content)
- Border: `border-white/10` (sidebar right edge)
- Active nav: `bg-brand-purple/20 border-l-2 border-brand-purple text-brand-purple-light`
- Hover nav: `hover:bg-white/5 hover:text-white`
- Top bar: `bg-brand-black-light border-b border-white/10`

---

## Verification

- Admin: navigate to `/admin/orders` directly — sidebar shows, correct item highlighted, no public header visible
- Admin: collapse sidebar — persists after page refresh
- Admin: click "Preview do Site" — opens `/games/cs2` in new tab
- Admin: `/admin` dashboard has no link cards, just stats
- Booster: `/booster` stat cards are not clickable; tabs switch content correctly
- Booster: sidebar "Pagamentos" goes to `/booster/payments` correctly
- Mobile: hamburger opens sidebar drawer; tapping backdrop closes it
- Client: `/dashboard` unaffected by shell changes; filter row scrolls horizontally
- Build: `npm run build` — no TypeScript errors
