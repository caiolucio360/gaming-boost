# Frontend Refactoring Plan

## Vision
Create a **premium, maintainable, and scalable** frontend architecture that leverages the refactored backend. The focus is on **Simplicity** (clean code), **Performance** (smart fetching), and **Aesthetics** (Design System adherence).

> [!IMPORTANT]
> **Design System Ready**
> The strict Design System (Colors, Typography, Components) is documented in `docs/design_system.md`.
> **All frontend development MUST follow these tokens.**

## 1. Architecture: Feature-based & Modular
We will move away from a "flat" structure to a "Feature-based" structure where applicable, while keeping core UI components generic.

```
src/
├── app/                  # Next.js App Router (Pages & Layouts)
├── components/
│   ├── ui/               # Generic Design System Components (Button, Input, Card) - NO BUSINESS LOGIC
│   ├── features/         # Business Logic Components (grouped by domain)
│   │   ├── auth/         # Login, Register forms
│   │   ├── orders/       # OrderList, OrderDetail, OrderWizard
│   │   ├── payments/     # PaymentStatus, PixCode
│   │   └── admin/        # AdminDashboard widgets
│   └── layout/           # Header, Footer, Sidebar
├── lib/
│   ├── api.ts            # Typed API Client (Axios/Fetch wrapper)
│   ├── hooks/            # Global hooks (useTheme, useAuth)
│   └── utils.ts          # Formatters, helpers
├── stores/               # State Management (Zustand)
└── styles/
    └── globals.css       # Tailwind directives & CSS Variables (The Design System)
```

## 2. Technology Stack & Tools
*   **Styling**: TailwindCSS (configured strictly with `docs/design_system.md` tokens).
*   **State Management**: Zustand (for global client state like Cart or UserSession).
*   **Data Fetching**: React Query (TanStack Query) - **Crucial** for managing server state, caching, and loading states without "useEffect hell".
*   **Icons**: Lucide React (modern, clean).
*   **Forms**: React Hook Form + Zod (aligned with backend schemas).

## 3. Implementation Steps

### Phase 1: Foundation (Design System)
*   **Tailwind Config**: Define `tailwind.config.js` to match the **Tokens** from `docs/design_system.md`.
    *   Map `colors`, `spacing`, `borderRadius`, `fontSize` exactly to the spec.
*   **Base CSS**: Set up CSS variables in `globals.css` for light/dark mode support.
*   **UI Kit**: Build the core "Atomic" components in `components/ui`:
    *   `Button` (Primary, Secondary, Strong)
    *   `Card` (Surface, Shadow, Hover)
    *   `Input` / `Select` (Forms)
    *   `Typography` (Text variants)
    *   *Deliverable*: A "Style Guide" page to preview all components.

### Phase 2: Integration & Features
*   **API Client**: Create a robust `api` helper that handles:
    *   Authentication headers.
    *   Standard error handling (Toast notifications).
    *   Response typing (aligning with backend `Result<T>`).
*   **Auth Flow**: Update Login/Register pages to use new UI Kit and API.
*   **Order Flow (The Core)**:
    *   New "Wizard" style order creation (Step-by-step).
    *   Integration with new `OrderService` endpoints.
*   **Payment Flow**:
    *   Real-time polling (or WebSocket) for Payment Status using React Query.
    *   Display PIX QRCode beautifully.

### Phase 3: Polish & UX
*   **Micro-interactions**: Add `framer-motion` for subtle entrance animations and hover effects.
*   **Mobile Mobile Mobile**: Ensure touch targets are 44px+, replace Hovers with clear Active states on mobile.
*   **Loading States**: Replace spinners with **Skeletons** (App feeling).

## 4. Priority List

1.  **Design System Setup**: Configure Tailwind & Variables. **(Blocker)**
2.  **UI Kit Implementation**: Build basic components.
3.  **Auth Pages Refactor**: Validate new look & feel.
4.  **Dashboard/Home Refactor**: Main user landing.
5.  **Order Creation Flow**: Complex form logic.
6.  **Admin Area**: Simplify into clean data tables.
