<div align="center">

# FlautasBoost

**A full-stack marketplace that connects gamers with professional rank boosters — with instant PIX payments, an automated commission-split engine, and role-based dashboards for clients, boosters, and admins.**

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

### [🚀 Live Demo](https://gaming-boost.vercel.app) · [Architecture](#-architecture) · [Engineering Highlights](#-engineering-highlights)

</div>

---

## 🎯 Overview

FlautasBoost is a production-grade SaaS marketplace for video-game boosting services. Players buy rank-up services, professional boosters claim and fulfill them, and the platform handles payments, escrow-style refunds, and an automated revenue split between boosters, admins, and a privileged "dev-admin" — all behind a polished, theme-aware UI.

It was built solo, end to end: data modeling, payment integration, authentication, the design system, the test suite, and the CI/CD-friendly deploy pipeline.

---

## ✨ Engineering Highlights

The parts I'm most proud of — the problems that were interesting to solve:

- **💳 Idempotent PIX payments** — AbacatePay integration where webhook confirmation uses an atomic `updateMany` guarded on `status = PENDING`, so duplicate webhooks are safe no-ops. Withdrawals use a provisional-record pattern to prevent TOCTOU overdrafts.
- **🧮 Commission-split engine** — On order creation, revenue shares are **snapshotted** (dev-admin takes a cut off-the-top, then booster/admin split the remainder) so later config changes never rewrite historical earnings. All percentages are database-driven.
- **🔐 Security by default** — AES-256-GCM encryption for stored Steam credentials, bcrypt password hashing, per-endpoint rate limiting, `CRON_SECRET`-guarded jobs, and middleware-enforced RBAC across `/admin`, `/booster`, and authenticated routes.
- **♻️ Automated account & order lifecycle** — Scheduled cron jobs auto-refund stale unclaimed orders, purge unconfirmed accounts after a grace window (freeing their unique email), and clean up orphaned blob uploads.
- **🎨 Enforced design system** — A custom build-failing guard (`scripts/check-design-system.mjs`) rejects hardcoded hex, arbitrary Tailwind values, and non-theme-able classes, keeping the light/dark token system consistent across the whole app.
- **🧪 Tested & type-safe** — 100+ Jest tests across API routes, components, Zod schemas, and security cases, with TypeScript strict mode everywhere.

---

## 🕹️ Features

**Clients** — configure services in a cart, pay via PIX QR code, track order status in real time, view the booster's completion screenshot, and self-cancel pending/paid orders with automatic refunds.

**Boosters** — claim available orders from a dedicated dashboard, upload a mandatory completion proof, and track commissions and PIX withdrawals.

**Admins** — paginated management of users, orders, and payments; configurable commission percentages (global and per-booster); database-driven dynamic pricing per game mode; and direct CLIENT ↔ BOOSTER role promotion.

**Roles:** `CLIENT` · `BOOSTER` · `ADMIN` · `Dev-Admin` (special admin with an off-the-top revenue share).

**Account lifecycle:** new accounts verify via a 6-digit email code; an unverified login auto-resends a fresh code and routes to the verification screen; unverified accounts are auto-purged after a grace window.

### Supported games
- **Counter-Strike 2** — Premier rank boost (1K–26K points) and Gamers Club levels (1–20), with progressive, admin-configurable pricing per rating band.

---

## 🏗️ Architecture

A layered Next.js App Router codebase that keeps business logic out of the route handlers.

- **Service layer** — domain logic in `src/services/`; API routes stay as thin controllers.
- **Result pattern** — services return `Success<T> | Failure` instead of throwing.
- **Centralized validation** — Zod schemas in `src/schemas/`, applied via a shared `validateBody` helper.
- **Typed API client** — a single `api` client wraps `fetch`, injects auth headers, and parses/throws structured errors so call sites just `try/await/catch`.
- **Database-driven config** — pricing and commission rules live in the DB, not in code.

```
src/
├── app/
│   ├── (auth)/         # Login, register, email verification, password reset
│   ├── admin/          # Admin panel — users, orders, payments, pricing, commissions
│   ├── booster/        # Booster dashboard — orders, payments
│   ├── api/            # Route handlers (auth, orders, payment, pricing, upload,
│   │                   #   webhooks, admin, booster, notifications, cron)
│   └── …               # Public marketing pages
├── components/         # ui/ (shadcn) · common/ (shared) · layout/ · games/
├── contexts/           # Auth, Cart
├── hooks/              # useLoading, useDebounce, useRealtime, data hooks
├── lib/                # db, auth, jwt, encryption, abacatepay, email, pricing, rate-limit
├── schemas/            # Zod schemas
├── services/           # Business logic (auth, order, payment, steam, user, verification)
└── __tests__/          # Tests grouped by domain
```

### Order & payment flow
1. Client checks out → a PIX QR code is generated via AbacatePay.
2. Webhook confirms payment → commission/revenue records are snapshotted.
3. An available booster claims the order → it moves to in-progress.
4. Booster completes with a screenshot → the client sees the proof.
5. Admin approves pending payouts.

**Order status:** `PENDING → PAID → IN_PROGRESS → COMPLETED / CANCELLED`

---

## 🛠️ Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | Next.js 15 (App Router, RSC, Turbopack), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), React Hook Form + Zod, Framer Motion, Recharts, Sonner |
| **Backend** | Next.js Route Handlers, Prisma 7 (PostgreSQL/Neon), NextAuth.js (JWT), bcryptjs, AbacatePay (PIX), Resend (email), Vercel Blob (uploads) |
| **Infra & tooling** | Vercel (deploy + Cron Jobs), Neon (serverless Postgres), Jest + Testing Library, ESLint, a custom design-system guard |

---

## 🚀 Getting Started

**Prerequisites:** Node.js 20+ and a PostgreSQL database (Neon recommended).

```bash
git clone <repository-url>
cd gaming-boost
npm install

# configure your .env (see below), then:
npm run db:push
npm run db:seed
npm run dev          # http://localhost:3000
```

<details>
<summary><strong>Environment variables</strong></summary>

```env
# Required
DATABASE_URL=               # PostgreSQL connection string
NEXTAUTH_SECRET=            # session JWT secret
JWT_SECRET=                 # custom API JWT secret
ENCRYPTION_KEY=             # 64 hex chars (AES-256 for Steam credentials)
NEXT_PUBLIC_API_URL=        # public API URL

# Payments & email
ABACATEPAY_API_KEY=
ABACATEPAY_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
CRON_SECRET=

# Uploads
BLOB_READ_WRITE_TOKEN=

# Optional
ORDER_TIMEOUT_HOURS=24      # auto-refund window (default 24)
UNVERIFIED_CLEANUP_DAYS=7   # purge unconfirmed accounts after N days (default 7)
NEXT_PUBLIC_SITE_URL=       # SEO
```
</details>

<details>
<summary><strong>Scripts</strong></summary>

```bash
npm run dev            # Dev server (Turbopack)
npm run build          # Production build
npm run lint           # ESLint + design-system guard
npm test               # Run all tests
npm run test:coverage  # Coverage report
npm run db:studio      # Prisma Studio
```
</details>

---

## 📝 License

Proprietary — all rights reserved. Showcased here as a portfolio project; not licensed for reuse.

<div align="center">

Built with ☕ and a lot of TypeScript by **Caio Lúcio**.

</div>
