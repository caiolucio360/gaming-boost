# Design Spec: Chat Credentials Flow, Standalone Withdraw, PIX Enforcement, Retention Page

**Date:** 2026-04-07  
**Status:** Approved  
**Features:** #2 Steam Credentials via Chat · #7 Standalone Withdraw · #8 PIX Key Enforcement · #9 Retention Page

---

## Feature #2 — Steam Credentials via Chat

### Problem

The chat system and `OrderChat` component are fully implemented in the backend and as a React component, but **never rendered in any page**. There is also no Steam credentials input on the order creation form. Credentials need to flow through the encrypted chat after booster acceptance.

### Flow

```
Client creates order (no credentials at creation)
  └─ Booster accepts → boosterId assigned, status stays PAID
      └─ Chat opens with system message: "Envie suas credenciais Steam para iniciar"
          └─ Client sends STEAM_CREDENTIALS message via OrderChat
              └─ Booster clicks "Iniciar Boost" → POST /api/booster/orders/[id]/start
                  └─ Server validates credentials exist → status → IN_PROGRESS
```

### Backend Changes

**`src/services/order.service.ts`**

`acceptOrder({ orderId, boosterId })`:
- Remove `status: IN_PROGRESS` from the update — set only `boosterId`
- Status remains `PAID`
- Still creates `BoosterCommission` record (snapshotted at acceptance)
- Still checks for duplicate active orders, race condition guard via `updateMany` with `boosterId: null`

New method `startOrder({ orderId, boosterId })`:
- Validates order is `PAID` and `boosterId` matches caller
- Calls `ChatService.hasCredentials(orderId)` — fails with `CREDENTIALS_REQUIRED` if no active `STEAM_CREDENTIALS` message
- Transitions `PAID → IN_PROGRESS`
- Sends email notification to client (`sendOrderAcceptedEmail`)
- Creates `OrderChat` and posts system message if not already created

**`src/services/chat.service.ts`**

New method `hasCredentials(orderId)`:
- Checks `OrderMessage` for `messageType: 'STEAM_CREDENTIALS'`, `isExpired: false` in the order's chat
- Returns `Result<{ hasCredentials: boolean }>`

`isChatEnabled(orderId)`:
- Enable chat for `PAID` orders when `boosterId` is not null (in addition to existing `IN_PROGRESS`)

`getOrCreateChat` called in `acceptOrder` flow:
- Auto-creates chat and posts a `SYSTEM` message when booster accepts

**New API endpoint**

`POST /api/booster/orders/[id]/start`:
- Auth: `verifyBooster`
- Calls `OrderService.startOrder({ orderId, boosterId })`
- Returns 200 with updated order or error with appropriate status code

### Frontend Changes

**Booster dashboard (`src/app/booster/page.tsx`)**

Order card when status is `PAID` and `boosterId === user.id` (accepted, awaiting credentials):
- Shows `OrderChat` component below the card
- Fetches `GET /api/orders/[id]/chat` on mount to check for existing credentials
- `hasCredentials` state = true if any non-expired `STEAM_CREDENTIALS` message exists in fetched messages
- `OrderChat` `onNewMessage` callback re-checks: if new message is `STEAM_CREDENTIALS`, set `hasCredentials = true`
- Shows "Iniciar Boost" button, disabled until `hasCredentials` is true
- "Iniciar Boost" calls `POST /api/booster/orders/[id]/start`

**Client dashboard (`src/app/dashboard/page.tsx`)**

Order card when status is `PAID` and `boosterId` is set:
- Shows `OrderChat` component below the card
- Shows info banner: "Seu booster está pronto. Envie suas credenciais Steam para iniciar o boost."
- `OrderChat` already supports `STEAM_CREDENTIALS` message type with the credentials form

Both dashboards also show `OrderChat` for `IN_PROGRESS` orders (as before).

### Existing infrastructure reused without changes

- `OrderChat` component — already handles TEXT and STEAM_CREDENTIALS rendering
- `SteamCredentialsCard` — already handles reveal/hide with 30s auto-hide
- `/api/orders/[id]/chat` GET/POST — unchanged
- Encryption in `ChatService.sendMessage` — unchanged
- `wipeSteamCredentials` on order close — unchanged

---

## Feature #7 — Standalone Withdraw Screens (Booster + Admin)

### Structure

**Booster:**
| Route | Content |
|---|---|
| `/booster/payments` | Commissions only (stats + filtered list). Tab "Saques" removed. |
| `/booster/withdraw` | Withdrawals only (balance, locked balance, form, history) |

**Admin:**
| Route | Content |
|---|---|
| `/admin/payments` | Revenues + Config tabs only. Tab "Saques" removed. |
| `/admin/withdraw` | Admin withdrawals (balance, form, history) |

### Shared component

`src/components/common/withdraw-content.tsx` — extracted from the current Saques tab in `/booster/payments`:
- Props: `apiBasePath: '/api/booster/withdraw' | '/api/admin/withdraw'`
- Contains: available balance card, locked balance card, withdrawal form, history list
- Both `/booster/withdraw` and `/admin/withdraw` render this component with the appropriate `apiBasePath`

### Sidebar updates (`src/components/layout/app-shell.tsx`)

`BOOSTER_NAV_ITEMS` — add:
```
{ label: 'Saques', href: '/booster/withdraw', icon: Wallet }
```

`ADMIN_NAV_ITEMS` — add:
```
{ label: 'Saques', href: '/admin/withdraw', icon: Wallet }
```

---

## Feature #8 — PIX Key Enforcement for Boosters

### Problem

Boosters without a PIX key can currently accept orders, but cannot receive payment. This should be blocked at both UI and server level.

### Backend

`order.service.ts` — `acceptOrder()` adds check before the transaction:
```
fetch booster's pixKey from User
if (!pixKey) return failure('Cadastre sua chave PIX antes de aceitar pedidos', 'PIX_KEY_REQUIRED')
```

Returns HTTP 400 from the API route.

### Frontend (`src/app/booster/page.tsx`)

On mount, fetch `GET /api/user/bank-account` (already exists) and store `hasPixKey` in state.

If `!hasPixKey`:
1. **Yellow banner at top of page:**  
   "Você não tem chave PIX cadastrada. [Cadastrar agora →](/profile)"
2. **All "Aceitar" buttons:** `disabled` with `title` tooltip: "Cadastre sua chave PIX no perfil para aceitar pedidos"

No changes to the profile page — PIX key remains freely editable.

---

## Feature #9 — Retention / Loyalty Page

### New API: `GET /api/user/retention`

Auth: any authenticated CLIENT.

Response:
```json
{
  "completedOrders": [
    { "id": 1, "targetRating": 12000, "targetRank": null, "gameMode": "CS2_PREMIER", "completedAt": "..." }
  ],
  "streak": 3,
  "discountPct": 0.10
}
```

Logic:
- Fetches orders where `userId = caller`, `status = COMPLETED`
- `streak` = count of completed orders
- `discountPct` = `getStreakDiscount(streak)` from `src/lib/retention-utils.ts`

### New Page: `/dashboard/retencao`

File: `src/app/dashboard/retencao/page.tsx`

Sections (top to bottom):

1. **Header** — `PageHeader` with "PROGRAMA DE" / "FIDELIDADE"
2. **Discount badge** — if `discountPct > 0`: green card "Você tem X% de desconto disponível". If 0: purple card "Complete mais pedidos para desbloquear descontos"
3. **Progression widgets** — `RetentionProgress` for PREMIER (and GC if applicable completed orders exist)
4. **Tier table** — static card explaining the tiers:
   - 1 pedido → 0%
   - 2 pedidos → 5% de desconto
   - 3 pedidos → 10% de desconto
   - 4+ pedidos → 15% de desconto
5. **How to use** — info card: "Seu desconto é aplicado automaticamente ao contratar um novo boost. Não é necessário nenhum cupom."
6. **Completed orders history** — table with: date, game mode, target rating, order ID

### Dashboard update (`src/app/dashboard/page.tsx`)

Below the existing `RetentionProgress` widget, add:
```tsx
<Link href="/dashboard/retencao">
  <Button variant="ghost" size="sm">Ver programa de fidelidade →</Button>
</Link>
```

### Route protection

`/dashboard/retencao` is under the `(dashboard)` layout which already requires authentication. No additional middleware needed.

---

## Implementation Order

1. **Feature #8** — PIX key enforcement (backend + booster dashboard banner). Smallest change, no new routes.
2. **Feature #7** — Standalone withdraw pages (extract `WithdrawContent`, new routes, sidebar). Self-contained refactor.
3. **Feature #9** — Retention page (new API + new page). No dependencies on other features.
4. **Feature #2** — Chat credentials flow (largest change: service logic + two dashboard UIs). Last because it touches the most existing code.
