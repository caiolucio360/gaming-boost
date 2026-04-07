# Features: PIX Enforcement, Standalone Withdraw, Retention Page, Chat Credentials

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four features: PIX key required to accept orders (#8), standalone withdraw screens for booster and admin (#7), client loyalty/retention page (#9), and Steam credentials via encrypted chat before boost starts (#2).

**Architecture:** Features are implemented in order of increasing complexity. #8 is a server + UI guard. #7 is a UI refactor with a shared component. #9 is a new API + page. #2 is the largest: splits `acceptOrder` into accept+start, wires the `OrderChat` component into both dashboards, and enforces credentials before IN_PROGRESS.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma 7, NextAuth JWT, Result<T> pattern (`success`/`failure` from `@/services/types`), brand palette Tailwind classes, `useLoading` hook, `showSuccess`/`showError` from `@/lib/toast`.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/error-constants.ts` | Modify | Add `PIX_KEY_REQUIRED`, `CREDENTIALS_REQUIRED` codes + messages + status map entries |
| `src/services/order.service.ts` | Modify | `acceptOrder`: pixKey check + keep PAID + auto-create chat; new `startOrder` method |
| `src/services/chat.service.ts` | Modify | New `hasCredentials()` method; update `isChatEnabled()` for PAID+boosterId |
| `src/app/api/booster/orders/[id]/start/route.ts` | Create | `POST` endpoint calling `OrderService.startOrder` |
| `src/components/order/order-chat.tsx` | Modify | Add optional `onMessagesUpdate` prop |
| `src/components/common/withdraw-content.tsx` | Create | Shared withdrawal UI (balance, form, history); accepts `apiBasePath` prop |
| `src/app/booster/payments/page.tsx` | Modify | Remove saques tab; keep commissions only |
| `src/app/admin/payments/page.tsx` | Modify | Remove saques tab; keep receitas + configurações |
| `src/components/layout/app-shell.tsx` | Modify | Add Saques nav item for BOOSTER and ADMIN |
| `src/app/booster/withdraw/page.tsx` | Create | Booster standalone withdraw page |
| `src/app/admin/withdraw/page.tsx` | Create | Admin standalone withdraw page |
| `src/app/api/user/retention/route.ts` | Create | GET endpoint: completed orders + streak + discountPct |
| `src/app/dashboard/retencao/page.tsx` | Create | Client loyalty page |
| `src/app/dashboard/page.tsx` | Modify | Add "Ver programa de fidelidade" link below RetentionProgress widget |
| `src/app/booster/page.tsx` | Modify | PIX banner + disabled accept if no PIX; chat + "Iniciar Boost" for accepted orders |
| `src/app/dashboard/page.tsx` | Modify | Show OrderChat for PAID+boosterId orders |

---

## Task 1: Add PIX_KEY_REQUIRED and CREDENTIALS_REQUIRED error codes

**Files:**
- Modify: `src/lib/error-constants.ts`

- [ ] **Step 1: Add the two new codes to `ErrorCodes`**

In `src/lib/error-constants.ts`, inside the `ErrorCodes` object after the `CHAT_DISABLED` entry:

```typescript
  // Business Logic (add after CHAT_DISABLED)
  PIX_KEY_REQUIRED: 'PIX_KEY_REQUIRED',
  CREDENTIALS_REQUIRED: 'CREDENTIALS_REQUIRED',
```

- [ ] **Step 2: Add HTTP status entries to `ErrorStatusMap`**

In `ErrorStatusMap`, after `[ErrorCodes.CHAT_DISABLED]: 400`:

```typescript
  [ErrorCodes.PIX_KEY_REQUIRED]: 400,
  [ErrorCodes.CREDENTIALS_REQUIRED]: 400,
```

- [ ] **Step 3: Add Portuguese messages to `ErrorMessages`**

In `ErrorMessages`, after the `ORDER_ACCESS_DENIED` entry (in the Orders section):

```typescript
  ORDER_PIX_KEY_REQUIRED: 'Cadastre sua chave PIX antes de aceitar pedidos.',
  ORDER_CREDENTIALS_REQUIRED: 'Aguardando credenciais Steam do cliente para iniciar o boost.',
  BOOSTER_START_ORDER_FAILED: 'Não foi possível iniciar o pedido. Por favor, tente novamente.',
```

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/error-constants.ts
git commit -m "feat: add PIX_KEY_REQUIRED and CREDENTIALS_REQUIRED error codes"
```

---

## Task 2: Feature #8 — Server-side PIX key enforcement in acceptOrder

**Files:**
- Modify: `src/services/order.service.ts`

- [ ] **Step 1: Add pixKey check at the start of `acceptOrder`**

In `src/services/order.service.ts`, inside `acceptOrder`, after fetching the order (after line `if (order.boosterId) { return failure(...) }`), add:

```typescript
      // Check booster has PIX key configured
      const booster = await prisma.user.findUnique({
        where: { id: boosterId },
        select: { pixKey: true },
      })
      if (!booster?.pixKey) {
        return failure(ErrorMessages.ORDER_PIX_KEY_REQUIRED, ErrorCodes.PIX_KEY_REQUIRED)
      }
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/order.service.ts
git commit -m "feat(#8): block order acceptance when booster has no PIX key"
```

---

## Task 3: Feature #8 — Booster dashboard PIX banner + disabled accept buttons

**Files:**
- Modify: `src/app/booster/page.tsx`

- [ ] **Step 1: Add `hasPixKey` state and fetch on mount**

In `src/app/booster/page.tsx`, after the existing state declarations (near line 88), add:

```typescript
  const [hasPixKey, setHasPixKey] = useState<boolean | null>(null)
```

In the initial data fetch `useEffect` (the one that calls `fetchOrders(false)` when `user?.role === 'BOOSTER'`), add a parallel fetch:

```typescript
  useEffect(() => {
    if (user && user.role === 'BOOSTER') {
      fetchOrders(false)
      // Check if booster has PIX key
      fetch('/api/user/bank-account')
        .then((r) => r.json())
        .then((data) => setHasPixKey(!!data.pixKey))
        .catch(() => setHasPixKey(true)) // fail open — server will enforce
    }
  }, [user?.id])
```

- [ ] **Step 2: Add the PIX banner below the PageHeader**

Find the `<PageHeader` render block. After it (before the stats grid or tabs), add:

```tsx
        {hasPixKey === false && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-xl flex items-center gap-3">
            <div className="flex-1">
              <p className="text-yellow-300 font-semibold font-orbitron text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                CHAVE PIX NÃO CADASTRADA
              </p>
              <p className="text-yellow-400/80 text-sm font-rajdhani mt-0.5" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Você precisa cadastrar sua chave PIX para aceitar pedidos e receber pagamentos.
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold flex-shrink-0">
                Cadastrar PIX
              </Button>
            </Link>
          </div>
        )}
```

Make sure `Link` is imported from `'next/link'` (already imported in this file).

- [ ] **Step 3: Disable "Aceitar" buttons when no PIX key**

Find the "Aceitar" button in the orders list render (it calls `setOrderToAction` / `setAcceptDialogOpen`). It should look like:

```tsx
<Button onClick={() => { setOrderToAction(order.id); setAcceptDialogOpen(true) }} ...>
  Aceitar
</Button>
```

Update it to:

```tsx
<Button
  onClick={() => { setOrderToAction(order.id); setAcceptDialogOpen(true) }}
  disabled={!hasPixKey}
  title={!hasPixKey ? 'Cadastre sua chave PIX no perfil para aceitar pedidos' : undefined}
  className="bg-brand-purple hover:bg-brand-purple-dark text-white font-bold"
>
  Aceitar
</Button>
```

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/booster/page.tsx
git commit -m "feat(#8): show PIX banner and disable accept button when PIX key missing"
```

---

## Task 4: Feature #7 — Create shared WithdrawContent component

**Files:**
- Create: `src/components/common/withdraw-content.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/common/withdraw-content.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Wallet, RefreshCw, Clock, CheckCircle2, XCircle, Lock } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { showSuccess, showError } from '@/lib/toast'

interface Withdrawal {
  id: number
  amount: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED' | 'CANCELLED'
  pixKeyType: string
  pixKey: string
  createdAt: string
  completedAt: string | null
  receiptUrl: string | null
}

interface LockedCommission {
  id: number
  amount: number
  availableForWithdrawalAt: string
  orderId: number
}

interface WithdrawContentProps {
  /** API base path: '/api/booster/withdraw' or '/api/admin/withdraw' */
  apiBasePath: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETE':
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>
    case 'PENDING':
    case 'PROCESSING':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
    case 'FAILED':
    case 'CANCELLED':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function WithdrawContent({ apiBasePath }: WithdrawContentProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [availableBalance, setAvailableBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  const [lockedCommissions, setLockedCommissions] = useState<LockedCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [pixKeyType, setPixKeyType] = useState('')
  const [pixKey, setPixKey] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(apiBasePath)
      const data = await res.json()
      if (res.ok) {
        setWithdrawals(data.withdrawals || [])
        setAvailableBalance(data.availableBalance || 0)
        setLockedBalance(data.lockedBalance || 0)
        setLockedCommissions(data.lockedCommissions || [])
      } else {
        showError(data.message || 'Erro ao carregar saques')
      }
    } catch {
      showError('Erro ao carregar saques')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [apiBasePath])

  const hasPendingWithdrawal = withdrawals.some(
    (w) => w.status === 'PENDING' || w.status === 'PROCESSING'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountInCents = Math.round(parseFloat(amount) * 100)
    if (!amountInCents || amountInCents < 350) { showError('Valor mínimo para saque é R$ 3,50'); return }
    if (amountInCents > availableBalance) { showError('Saldo insuficiente'); return }
    if (!pixKeyType || !pixKey) { showError('Preencha a chave PIX'); return }

    try {
      setIsSubmitting(true)
      const res = await fetch(apiBasePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInCents, pixKeyType, pixKey }),
      })
      const data = await res.json()
      if (res.ok) {
        showSuccess('Saque solicitado com sucesso!')
        setAmount('')
        setPixKey('')
        setPixKeyType('')
        fetchData()
      } else {
        showError(data.message || 'Erro ao solicitar saque')
      }
    } catch {
      showError('Erro ao processar solicitação')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Balance cards */}
      <div className={`grid gap-4 ${lockedBalance > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        <Card className="bg-gradient-to-br from-brand-purple/20 to-brand-purple-dark/10 border-brand-purple/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-brand-purple-light" />
                <div>
                  <p className="text-gray-400 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Saldo Disponível</p>
                  <p className="text-2xl font-bold text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {loading ? '...' : formatPrice(availableBalance / 100)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {lockedBalance > 0 && (
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Lock className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-gray-400 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Saldo Bloqueado</p>
                  <p className="text-2xl font-bold text-yellow-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {formatPrice(lockedBalance / 100)}
                  </p>
                  <p className="text-xs text-yellow-500 font-rajdhani mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Aguardando período de espera</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Locked commissions */}
      {lockedCommissions.length > 0 && (
        <Card className="bg-brand-black/30 backdrop-blur-md border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-yellow-300 font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <Clock className="w-5 h-5" />Comissões em Período de Espera
            </CardTitle>
            <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Estas comissões serão liberadas para saque nas datas abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lockedCommissions.map((commission) => {
                const releaseDate = new Date(commission.availableForWithdrawalAt)
                const diffMs = releaseDate.getTime() - Date.now()
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
                return (
                  <div key={commission.id} className="flex items-center justify-between p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                    <div>
                      <p className="text-white font-bold font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(commission.amount)}</p>
                      <p className="text-gray-400 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Pedido #{commission.orderId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-300 text-sm font-medium">
                        {diffDays === 0
                          ? (diffHours <= 1 ? 'Libera em breve' : `Libera em ${diffHours}h`)
                          : diffDays === 1 ? 'Libera amanhã' : `Libera em ${diffDays} dias`}
                      </p>
                      <p className="text-gray-500 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{formatDate(commission.availableForWithdrawalAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal form */}
      <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
        <CardHeader>
          <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>Novo Saque</CardTitle>
          <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Valor mínimo: R$ 3,50</CardDescription>
        </CardHeader>
        <CardContent>
          {hasPendingWithdrawal ? (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertDescription className="text-yellow-300">
                Você já tem um saque pendente. Aguarde a conclusão para solicitar outro.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Valor (R$)</Label>
                <Input type="number" step="0.01" min="3.50" max={availableBalance / 100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="bg-brand-black/50 border-brand-purple/50 text-white" required />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Tipo de Chave PIX</Label>
                <Select value={pixKeyType} onValueChange={setPixKeyType}>
                  <SelectTrigger className="bg-brand-black/50 border-brand-purple/50 text-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="EMAIL">E-mail</SelectItem>
                    <SelectItem value="PHONE">Celular</SelectItem>
                    <SelectItem value="RANDOM">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Chave PIX</Label>
                <Input type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Digite sua chave PIX" className="bg-brand-black/50 border-brand-purple/50 text-white" required />
              </div>
              <Button type="submit" className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-bold" disabled={isSubmitting || availableBalance < 350}>
                {isSubmitting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processando...</> : 'Solicitar Saque'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal history */}
      <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
        <CardHeader>
          <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>Histórico de Saques</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400 gap-3">
              <RefreshCw className="w-5 h-5 animate-spin" />Carregando...
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="text-gray-400 text-center py-8 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Nenhum saque realizado ainda.</p>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-brand-purple/20">
                  <div>
                    <p className="text-white font-bold">{formatPrice(w.amount / 100)}</p>
                    <p className="text-gray-400 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{w.pixKeyType}: {w.pixKey.substring(0, 10)}...</p>
                    <p className="text-gray-500 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{formatDate(w.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(w.status)}
                    {w.receiptUrl && w.status === 'COMPLETE' && (
                      <a href={w.receiptUrl} target="_blank" rel="noopener noreferrer" className="block text-brand-purple-light text-xs mt-1 hover:underline">
                        Ver comprovante
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/common/withdraw-content.tsx
git commit -m "feat(#7): add shared WithdrawContent component"
```

---

## Task 5: Feature #7 — Booster withdraw page + strip saques tab from payments

**Files:**
- Create: `src/app/booster/withdraw/page.tsx`
- Modify: `src/app/booster/payments/page.tsx`

- [ ] **Step 1: Create booster withdraw page**

```tsx
// src/app/booster/withdraw/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { PageHeader } from '@/components/common/page-header'
import { WithdrawContent } from '@/components/common/withdraw-content'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BoosterWithdrawPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'BOOSTER') {
      router.replace(user.role === 'ADMIN' ? '/admin' : '/dashboard')
    }
  }, [user, authLoading, router])

  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'BOOSTER') return null

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="mb-6">
        <Link href="/booster/payments">
          <Button variant="ghost" className="text-brand-purple-light hover:text-brand-purple-light mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Pagamentos
          </Button>
        </Link>
      </div>
      <PageHeader
        highlight="MEUS"
        title="SAQUES"
        description={`Olá, ${user.name || user.email}! Gerencie seus saques e saldo disponível.`}
      />
      <WithdrawContent apiBasePath="/api/booster/withdraw" />
    </div>
  )
}
```

- [ ] **Step 2: Remove saques tab from `/booster/payments/page.tsx`**

In `src/app/booster/payments/page.tsx`:

a) Remove these imports (no longer needed in this file after extraction):
- `Lock` from lucide-react
- `Wallet` icon (if only used in saques tab)
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Alert`, `AlertDescription`
- `Label`
- `Input`

b) Remove all saques-related state:
```typescript
// DELETE these state variables:
const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
const [availableBalance, setAvailableBalance] = useState(0)
const [lockedBalance, setLockedBalance] = useState(0)
const [lockedCommissions, setLockedCommissions] = useState<LockedCommission[]>([])
const [withdrawLoading, setWithdrawLoading] = useState(false)
const [isSubmitting, setIsSubmitting] = useState(false)
const [amount, setAmount] = useState('')
const [pixKeyType, setPixKeyType] = useState<string>('')
const [pixKey, setPixKey] = useState('')
```

c) Remove the `fetchWithdrawals` function and its call in `useEffect`.

d) Remove the `handleWithdrawSubmit` function.

e) Remove the `Withdrawal` and `LockedCommission` interface definitions.

f) Remove the `getWithdrawStatusBadge` helper.

g) Remove the `hasPendingWithdrawal` variable.

h) Change the `Tabs` from `grid-cols-2` to `grid-cols-1`, keep only "Comissões" tab. Remove the entire `<TabsContent value="saques">` block.

The resulting `<Tabs>` section should be:
```tsx
<Tabs defaultValue="comissoes" className="w-full">
  <TabsList className="grid w-full grid-cols-1 bg-brand-black/30 border border-brand-purple/50 mb-6">
    <TabsTrigger value="comissoes" className="data-[state=active]:bg-brand-purple/20">
      <DollarSign className="h-4 w-4 mr-2" />Comissões
    </TabsTrigger>
  </TabsList>
  {/* ... commissions tab content unchanged ... */}
</Tabs>
```

i) Add a link to the withdraw page below the `PageHeader`:
```tsx
<div className="flex justify-end mb-4">
  <Link href="/booster/withdraw">
    <Button variant="outline" className="border-brand-purple/50 text-brand-purple-light hover:bg-brand-purple/10">
      <Wallet className="h-4 w-4 mr-2" />Ver Saques
    </Button>
  </Link>
</div>
```
Keep `Wallet` import for this button.

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/booster/withdraw/page.tsx src/app/booster/payments/page.tsx
git commit -m "feat(#7): standalone booster withdraw page, remove saques tab from payments"
```

---

## Task 6: Feature #7 — Admin withdraw page + strip saques tab from admin payments

**Files:**
- Create: `src/app/admin/withdraw/page.tsx`
- Modify: `src/app/admin/payments/page.tsx`

- [ ] **Step 1: Create admin withdraw page**

```tsx
// src/app/admin/withdraw/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { PageHeader } from '@/components/common/page-header'
import { WithdrawContent } from '@/components/common/withdraw-content'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminWithdrawPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'ADMIN') {
      router.replace(user.role === 'BOOSTER' ? '/booster' : '/dashboard')
    }
  }, [user, authLoading, router])

  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="mb-6">
        <Link href="/admin/payments">
          <Button variant="ghost" className="text-brand-purple-light hover:text-brand-purple-light mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Pagamentos
          </Button>
        </Link>
      </div>
      <PageHeader
        highlight="ADMIN"
        title="SAQUES"
        description={`Olá, ${user.name || user.email}! Gerencie seus saques e saldo disponível.`}
      />
      <WithdrawContent apiBasePath="/api/admin/withdraw" />
    </div>
  )
}
```

- [ ] **Step 2: Remove saques tab from `/admin/payments/page.tsx`**

In `src/app/admin/payments/page.tsx`:

a) Remove all saques-related state variables:
```typescript
// DELETE:
const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
const [availableBalance, setAvailableBalance] = useState(0)
const [withdrawLoading, setWithdrawLoading] = useState(false)
const [isSubmitting, setIsSubmitting] = useState(false)
const [amount, setAmount] = useState('')
const [pixKeyType, setPixKeyType] = useState<string>('')
const [pixKey, setPixKey] = useState('')
```

b) Remove `fetchWithdrawals` function, its call in `useEffect`, `handleWithdrawSubmit`, `Withdrawal` interface, `getWithdrawStatusBadge` helper, and `hasPendingWithdrawal` variable.

c) Change `Tabs` from `grid-cols-3` to `grid-cols-2`, remove saques tab trigger and content. Result:

```tsx
<Tabs defaultValue="receitas" className="w-full">
  <TabsList className="grid w-full grid-cols-2 bg-brand-black/30 border border-brand-purple/50 mb-6">
    <TabsTrigger value="receitas" className="data-[state=active]:bg-brand-purple/20">
      <DollarSign className="h-4 w-4 mr-2" />Receitas
    </TabsTrigger>
    <TabsTrigger value="configuracoes" className="data-[state=active]:bg-amber-500/20">
      <Settings className="h-4 w-4 mr-2" />Configurações
    </TabsTrigger>
  </TabsList>
  {/* receitas tab content — unchanged */}
  {/* configuracoes tab content — unchanged */}
</Tabs>
```

d) Add link to admin withdraw page after `PageHeader`:
```tsx
<div className="flex justify-end mb-4">
  <Link href="/admin/withdraw">
    <Button variant="outline" className="border-brand-purple/50 text-brand-purple-light hover:bg-brand-purple/10">
      <Wallet className="h-4 w-4 mr-2" />Ver Saques
    </Button>
  </Link>
</div>
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/withdraw/page.tsx src/app/admin/payments/page.tsx
git commit -m "feat(#7): standalone admin withdraw page, remove saques tab from admin payments"
```

---

## Task 7: Feature #7 — Add Saques to sidebar nav for both roles

**Files:**
- Modify: `src/components/layout/app-shell.tsx`

- [ ] **Step 1: Add Saques to BOOSTER_NAV_ITEMS**

Find `BOOSTER_NAV_ITEMS` (currently has 2 items). Add the third:

```typescript
const BOOSTER_NAV_ITEMS: NavItem[] = [
  { label: 'Meus Trabalhos', href: '/booster',          icon: Briefcase, exact: true },
  { label: 'Pagamentos',     href: '/booster/payments', icon: DollarSign },
  { label: 'Saques',         href: '/booster/withdraw', icon: Wallet },
]
```

- [ ] **Step 2: Add Saques to ADMIN_NAV_ITEMS**

Find `ADMIN_NAV_ITEMS`. Add after `Pagamentos`:

```typescript
const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/admin',             icon: LayoutDashboard, exact: true },
  { label: 'Pedidos',      href: '/admin/orders',      icon: ShoppingCart },
  { label: 'Usuários',     href: '/admin/users',       icon: Users },
  { label: 'Boosters',     href: '/admin/boosters',    icon: Shield },
  { label: 'Precificação', href: '/admin/pricing',     icon: SlidersHorizontal },
  { label: 'Pagamentos',   href: '/admin/payments',    icon: CreditCard },
  { label: 'Saques',       href: '/admin/withdraw',    icon: Wallet },
  { label: 'Comissões',    href: '/admin/commissions', icon: Percent },
  {
    separator: true,
    label: 'Preview do Site',
    href: '/games/cs2',
    icon: ExternalLink,
    external: true,
  },
]
```

`Wallet` is already imported in this file (it was used for the old sidebar logout area). Verify it's in the import block; if not, add it to the lucide-react import.

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-shell.tsx
git commit -m "feat(#7): add Saques nav item to booster and admin sidebars"
```

---

## Task 8: Feature #9 — Retention API endpoint

**Files:**
- Create: `src/app/api/user/retention/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/user/retention/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createApiErrorResponse } from '@/lib/api-errors'
import { getStreakDiscount } from '@/lib/retention-utils'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult.error || 'Não autenticado', 401)
    }

    const userId = authResult.user.id

    const completedOrders = await prisma.order.findMany({
      where: { userId, status: 'COMPLETED' },
      select: {
        id: true,
        targetRating: true,
        targetRank: true,
        gameMode: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'asc' },
    })

    const streak = completedOrders.length
    const discountPct = getStreakDiscount(streak)

    const orders = completedOrders.map((o) => ({
      id: o.id,
      targetRating: o.targetRating,
      targetRank: o.targetRank,
      gameMode: o.gameMode,
      completedAt: o.updatedAt,
    }))

    return NextResponse.json({ completedOrders: orders, streak, discountPct }, { status: 200 })
  } catch (error) {
    return createApiErrorResponse(error, 'Erro ao buscar dados de retenção', 'GET /api/user/retention')
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/retention/route.ts
git commit -m "feat(#9): add GET /api/user/retention endpoint"
```

---

## Task 9: Feature #9 — Retention page + dashboard link

**Files:**
- Create: `src/app/dashboard/retencao/page.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create the retention page**

```tsx
// src/app/dashboard/retencao/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Gift, Star, Zap, Trophy } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { RetentionProgress } from '@/components/common/retention-progress'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface CompletedOrder {
  id: number
  targetRating: number | null
  targetRank: string | null
  gameMode: string | null
  completedAt: string
}

const TIERS = [
  { orders: 1, discount: 0,    label: '0%',  icon: Star,   color: 'text-gray-400' },
  { orders: 2, discount: 5,    label: '5%',  icon: Zap,    color: 'text-brand-purple-light' },
  { orders: 3, discount: 10,   label: '10%', icon: Gift,   color: 'text-yellow-400' },
  { orders: 4, discount: 15,   label: '15%', icon: Trophy, color: 'text-green-400' },
]

export default function RetencaoPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([])
  const [streak, setStreak] = useState(0)
  const [discountPct, setDiscountPct] = useState(0)
  const { loading, withLoading } = useLoading({ initialLoading: true })

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      withLoading(async () => {
        const res = await fetch('/api/user/retention')
        if (res.ok) {
          const data = await res.json()
          setCompletedOrders(data.completedOrders || [])
          setStreak(data.streak || 0)
          setDiscountPct(data.discountPct || 0)
        }
      })
    }
  }, [user?.id])

  if (authLoading || loading) return <LoadingSpinner />
  if (!user) return null

  const hasPremier = completedOrders.some((o) => o.gameMode?.toUpperCase().includes('PREMIER'))
  const hasGC = completedOrders.some((o) => o.gameMode?.toUpperCase().includes('GC'))

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-brand-purple-light hover:text-brand-purple-light mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Dashboard
          </Button>
        </Link>
      </div>

      <PageHeader
        highlight="PROGRAMA DE"
        title="FIDELIDADE"
        description="Quanto mais você impulsiona, mais você economiza. Veja seu progresso e descontos disponíveis."
      />

      {/* Discount badge */}
      <div className="mb-6">
        {discountPct > 0 ? (
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Trophy className="w-10 h-10 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-300 font-bold text-xl font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {Math.round(discountPct * 100)}% DE DESCONTO DISPONÍVEL
                  </p>
                  <p className="text-green-400/80 text-sm font-rajdhani mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Seu desconto de fidelidade é aplicado automaticamente no próximo boost.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-brand-purple/20 to-brand-purple-dark/10 border-brand-purple/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Gift className="w-10 h-10 text-brand-purple-light flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-lg font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {streak === 0 ? 'COMPLETE SEU PRIMEIRO BOOST' : 'COMPLETE MAIS UM BOOST'}
                  </p>
                  <p className="text-brand-gray-400 text-sm font-rajdhani mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {streak === 0
                      ? 'Faça seu primeiro pedido e comece a acumular descontos.'
                      : 'Mais 1 boost concluído para desbloquear 5% de desconto.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progression widgets */}
      {(hasPremier || hasGC) && (
        <div className="grid gap-4 mb-6">
          {hasPremier && (
            <RetentionProgress
              completedOrders={completedOrders}
              currentDiscountPct={discountPct}
              gameMode="PREMIER"
            />
          )}
          {hasGC && (
            <RetentionProgress
              completedOrders={completedOrders}
              currentDiscountPct={discountPct}
              gameMode="GC"
            />
          )}
        </div>
      )}

      {/* Tier table */}
      <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 mb-6">
        <CardHeader>
          <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Níveis de Desconto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {TIERS.map((tier) => {
              const isActive = streak >= tier.orders
              const isCurrent = streak === tier.orders || (tier.orders === 4 && streak >= 4)
              const Icon = tier.icon
              return (
                <div
                  key={tier.orders}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCurrent
                      ? 'bg-brand-purple/20 border-brand-purple/60'
                      : isActive
                      ? 'bg-white/5 border-white/10'
                      : 'bg-black/20 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${tier.color}`} />
                    <span className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      {tier.orders === 4 ? '4+ pedidos concluídos' : `${tier.orders} pedido${tier.orders > 1 ? 's' : ''} concluído${tier.orders > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={tier.discount > 0 ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-white/10 text-gray-400 border-white/20'}>
                      {tier.discount > 0 ? `${tier.discount}% off` : 'Sem desconto'}
                    </Badge>
                    {isCurrent && <Badge className="bg-brand-purple/30 text-brand-purple-light border-brand-purple/50">Você está aqui</Badge>}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* How to use */}
      <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/30 mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-brand-purple-light flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Como usar meu desconto?</p>
              <p className="text-brand-gray-400 text-sm mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Seu desconto de fidelidade é aplicado automaticamente ao contratar um novo boost. Não é necessário nenhum cupom — basta escolher o serviço e o desconto aparece no checkout.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {completedOrders.length > 0 && (
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
          <CardHeader>
            <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Histórico de Boosts Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...completedOrders].reverse().map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {order.gameMode || 'CS2'} {order.targetRating ? `→ ${order.targetRating.toLocaleString('pt-BR')} pts` : order.targetRank ? `→ ${order.targetRank}` : ''}
                    </p>
                    <p className="text-gray-500 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Pedido #{order.id}</p>
                  </div>
                  <p className="text-brand-gray-400 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {formatDate(order.completedAt)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {completedOrders.length === 0 && (
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/30">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-brand-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Você ainda não tem boosts concluídos. Complete seu primeiro pedido para começar a acumular descontos!
            </p>
            <Link href="/games/cs2" className="mt-4 inline-block">
              <Button className="bg-brand-purple hover:bg-brand-purple-dark text-white font-bold mt-4">
                Contratar Boost
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add "Ver programa de fidelidade" link in client dashboard**

In `src/app/dashboard/page.tsx`, find the `RetentionProgress` widget block:

```tsx
{completedOrders.length > 0 && (
  <div className="mb-6">
    <RetentionProgress ... />
  </div>
)}
```

Change it to:

```tsx
{completedOrders.length > 0 && (
  <div className="mb-6">
    <RetentionProgress
      completedOrders={completedOrders}
      currentDiscountPct={currentDiscountPct}
      gameMode="PREMIER"
    />
    <div className="mt-3 flex justify-end">
      <Link href="/dashboard/retencao">
        <Button variant="ghost" size="sm" className="text-brand-purple-light hover:text-brand-purple-light text-sm">
          Ver programa de fidelidade →
        </Button>
      </Link>
    </div>
  </div>
)}
```

Make sure `Link` is imported from `'next/link'` in `dashboard/page.tsx`.

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/retencao/page.tsx src/app/dashboard/page.tsx
git commit -m "feat(#9): add retention/loyalty page and dashboard link"
```

---

## Task 10: Feature #2 — ChatService: hasCredentials + isChatEnabled update

**Files:**
- Modify: `src/services/chat.service.ts`

- [ ] **Step 1: Add `hasCredentials` method to `ChatService`**

At the end of `ChatService` object (before the closing `}`), add:

```typescript
  /**
   * Check if an active (non-expired) STEAM_CREDENTIALS message exists for this order.
   * Used by booster to know when they can start the order.
   */
  async hasCredentials(orderId: number): Promise<Result<{ hasCredentials: boolean }>> {
    try {
      const chat = await prisma.orderChat.findUnique({
        where: { orderId },
        select: { id: true },
      })

      if (!chat) {
        return success({ hasCredentials: false })
      }

      const credMessage = await prisma.orderMessage.findFirst({
        where: {
          chatId: chat.id,
          messageType: 'STEAM_CREDENTIALS',
          isExpired: false,
        },
        select: { id: true },
      })

      return success({ hasCredentials: !!credMessage })
    } catch (error) {
      console.error('Error checking credentials:', error)
      return failure('Erro ao verificar credenciais', 'DATABASE_ERROR')
    }
  },
```

- [ ] **Step 2: Update `isChatEnabled` to allow PAID orders with boosterId**

Find `isChatEnabled` in `chat.service.ts`. Replace the body:

```typescript
  async isChatEnabled(orderId: number): Promise<Result<{ enabled: boolean; reason?: string }>> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, boosterId: true },
      })

      if (!order) {
        return failure('Pedido não encontrado', 'ORDER_NOT_FOUND')
      }

      // Chat enabled for IN_PROGRESS orders
      if (order.status === OrderStatus.IN_PROGRESS) {
        return success({ enabled: true })
      }

      // Chat enabled for PAID orders when a booster has been assigned (credentials exchange phase)
      if (order.status === OrderStatus.PAID && order.boosterId !== null) {
        return success({ enabled: true })
      }

      // Chat readable but not writable for COMPLETED orders
      if (order.status === OrderStatus.COMPLETED) {
        return success({ enabled: false, reason: 'Pedido concluído. O chat está desabilitado.' })
      }

      return success({
        enabled: false,
        reason: 'Chat disponível apenas para pedidos em andamento.',
      })
    } catch (error) {
      console.error('Error checking chat status:', error)
      return failure('Erro ao verificar status do chat', 'DATABASE_ERROR')
    }
  },
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/services/chat.service.ts
git commit -m "feat(#2): add hasCredentials(), enable chat for PAID+boosterId orders"
```

---

## Task 11: Feature #2 — OrderService: split acceptOrder + add startOrder

**Files:**
- Modify: `src/services/order.service.ts`

- [ ] **Step 1: Modify `acceptOrder` to keep status PAID and auto-create chat**

In `src/services/order.service.ts`, inside `acceptOrder`'s `prisma.$transaction`, find:

```typescript
          data: {
            boosterId,
            status: OrderStatus.IN_PROGRESS,
          },
```

Change to:

```typescript
          data: {
            boosterId,
            // Status stays PAID — booster must start separately after client shares credentials
          },
```

Also inside the transaction, after the `updateMany` call but before creating the commission, add:

```typescript
        // Auto-create chat and post system message asking for credentials
        const existingChat = await tx.orderChat.findUnique({ where: { orderId }, select: { id: true } })
        let chatId: number
        if (existingChat) {
          chatId = existingChat.id
        } else {
          const newChat = await tx.orderChat.create({
            data: { orderId, isActive: true },
            select: { id: true },
          })
          chatId = newChat.id
        }
        await tx.orderMessage.create({
          data: {
            chatId,
            authorId: boosterId,
            content: encrypt(
              'Olá! Sou seu booster. Por favor, envie suas credenciais Steam (usuário e senha) pelo botão abaixo para que eu possa iniciar o boost.'
            ),
            isEncrypted: true,
            messageType: 'TEXT',
          },
        })
```

This requires `encrypt` to be imported — it's already available: `import { encrypt, decrypt } from '@/lib/encryption'` ... actually check the imports in order.service.ts. If `encrypt` is not imported there, add it:

```typescript
import { encrypt } from '@/lib/encryption'
```

Also update the notification message (since order is now PAID waiting for credentials, not IN_PROGRESS):

```typescript
      // Create notification for client
      if (updatedOrder.user?.id && updatedOrder.booster?.name) {
        prisma.notification.create({
          data: {
            userId: updatedOrder.user.id,
            type: 'BOOSTER_ASSIGNED',
            title: 'Booster Atribuído!',
            message: `${updatedOrder.booster.name} aceitou seu pedido #${orderId}. Envie suas credenciais Steam pelo chat para iniciar o boost.`,
            metadata: JSON.stringify({ orderId, boosterId }),
          },
        }).catch((error) => {
          console.error('Failed to create notification:', error)
        })
      }
```

Remove or skip the `sendOrderAcceptedEmail` call in `acceptOrder` — that email will be sent in `startOrder` when the boost actually begins.

- [ ] **Step 2: Add `startOrder` method**

After `acceptOrder`, before `completeOrder`, add:

```typescript
  /**
   * Booster starts an order — transitions PAID → IN_PROGRESS after credentials are shared.
   * Validates that the client has sent STEAM_CREDENTIALS in chat.
   */
  async startOrder(input: { orderId: number; boosterId: number }): Promise<Result<OrderWithRelations>> {
    const { orderId, boosterId } = input

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, boosterId: true, userId: true, gameMode: true },
      })

      if (!order) {
        return failure(ErrorMessages.ORDER_NOT_FOUND, ErrorCodes.ORDER_NOT_FOUND)
      }

      if (order.boosterId !== boosterId) {
        return failure(ErrorMessages.ORDER_ACCESS_DENIED, ErrorCodes.FORBIDDEN)
      }

      if (order.status !== OrderStatus.PAID) {
        return failure(ErrorMessages.ORDER_NOT_PAID, ErrorCodes.INVALID_STATUS_TRANSITION)
      }

      // Validate that credentials have been shared in chat
      const credResult = await ChatService.hasCredentials(orderId)
      if (!credResult.success) {
        return credResult as Failure
      }
      if (!credResult.data.hasCredentials) {
        return failure(ErrorMessages.ORDER_CREDENTIALS_REQUIRED, ErrorCodes.CREDENTIALS_REQUIRED)
      }

      // Transition to IN_PROGRESS
      const updatedOrder = await prisma.$transaction(async (tx: any) => {
        const updateResult = await tx.order.updateMany({
          where: { id: orderId, status: OrderStatus.PAID, boosterId },
          data: { status: OrderStatus.IN_PROGRESS },
        })

        if (updateResult.count === 0) {
          throw new ServiceError('Pedido não pôde ser iniciado', ErrorCodes.INVALID_STATUS_TRANSITION)
        }

        return tx.order.findUnique({
          where: { id: orderId },
          include: {
            user: { select: { id: true, name: true, email: true } },
            booster: { select: { id: true, name: true, email: true } },
          },
        })
      })

      if (!updatedOrder) {
        return failure('Erro ao buscar pedido atualizado', ErrorCodes.DATABASE_ERROR)
      }

      // Send email to client that boost has started
      if (updatedOrder.user?.email && updatedOrder.booster?.name) {
        const serviceName = updatedOrder.gameMode ? `CS2 ${updatedOrder.gameMode}` : 'Boost CS2'
        sendOrderAcceptedEmail(
          updatedOrder.user.email,
          updatedOrder.id,
          serviceName,
          updatedOrder.booster.name
        ).catch((error) => {
          console.error('Failed to send order started email:', error)
        })
      }

      // Notify client
      if (updatedOrder.user?.id) {
        prisma.notification.create({
          data: {
            userId: updatedOrder.user.id,
            type: 'ORDER_UPDATE',
            title: 'Boost Iniciado!',
            message: `Seu pedido #${orderId} foi iniciado. Acompanhe o progresso pelo chat.`,
            metadata: JSON.stringify({ orderId }),
          },
        }).catch((error) => {
          console.error('Failed to create start notification:', error)
        })
      }

      return success(updatedOrder as OrderWithRelations)
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        return failure(error.message, error.code)
      }
      console.error('Error starting order:', error)
      return failure('Erro ao iniciar pedido', ErrorCodes.DATABASE_ERROR)
    }
  },
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/services/order.service.ts
git commit -m "feat(#2): split acceptOrder (stays PAID), add startOrder with credentials check"
```

---

## Task 12: Feature #2 — New POST /api/booster/orders/[id]/start endpoint

**Files:**
- Create: `src/app/api/booster/orders/[id]/start/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/booster/orders/[id]/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyBooster, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { getStatusForError } from '@/lib/error-constants'
import { OrderService } from '@/services'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult.error || ErrorMessages.AUTH_UNAUTHENTICATED, 401)
    }

    const { id } = await params
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json({ message: 'ID do pedido inválido' }, { status: 400 })
    }

    const boosterId = authResult.user.id
    const result = await OrderService.startOrder({ orderId, boosterId })

    if (!result.success) {
      const status = result.code ? getStatusForError(result.code) : 500
      return NextResponse.json({ message: result.error, code: result.code }, { status })
    }

    return NextResponse.json(
      { message: 'Boost iniciado com sucesso', order: result.data },
      { status: 200 }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.BOOSTER_START_ORDER_FAILED, 'POST /api/booster/orders/[id]/start')
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/booster/orders/[id]/start/route.ts
git commit -m "feat(#2): add POST /api/booster/orders/[id]/start endpoint"
```

---

## Task 13: Feature #2 — Add onMessagesUpdate prop to OrderChat

**Files:**
- Modify: `src/components/order/order-chat.tsx`

- [ ] **Step 1: Add `onMessagesUpdate` to the props interface**

Find `interface OrderChatProps` (around line 155):

```typescript
interface OrderChatProps {
  orderId: number
  className?: string
}
```

Change to:

```typescript
interface OrderChatProps {
  orderId: number
  className?: string
  /** Called whenever messages are fetched. Receives the latest messages array. */
  onMessagesUpdate?: (messages: ChatMessage[]) => void
}
```

- [ ] **Step 2: Destructure and call the prop**

Find `export function OrderChat({ orderId, className }: OrderChatProps)` and change to:

```typescript
export function OrderChat({ orderId, className, onMessagesUpdate }: OrderChatProps)
```

In the `fetchChat` function, after `setChat(data.chat)`, add:

```typescript
        if (data.chat?.messages && onMessagesUpdate) {
          onMessagesUpdate(data.chat.messages)
        }
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/order/order-chat.tsx
git commit -m "feat(#2): add onMessagesUpdate callback prop to OrderChat"
```

---

## Task 14: Feature #2 — Booster dashboard: chat + Iniciar Boost button

**Files:**
- Modify: `src/app/booster/page.tsx`

- [ ] **Step 1: Add `OrderChat` import and `hasCredentialsMap` state**

At the top of `src/app/booster/page.tsx`, add:

```typescript
import { OrderChat } from '@/components/order/order-chat'
```

After the `hasPixKey` state (from Task 3), add:

```typescript
  const [hasCredentialsMap, setHasCredentialsMap] = useState<Record<number, boolean>>({})
  const [startingOrderId, setStartingOrderId] = useState<number | null>(null)
```

- [ ] **Step 2: Add handler for starting an order**

After the existing handlers (e.g. `handleAccept`), add:

```typescript
  const handleStartOrder = async (orderId: number) => {
    setStartingOrderId(orderId)
    try {
      const res = await fetch(`/api/booster/orders/${orderId}/start`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showSuccess('Boost iniciado com sucesso!')
        fetchOrders(true)
      } else {
        showError(data.message || 'Erro ao iniciar pedido')
      }
    } catch {
      showError('Erro ao iniciar pedido')
    } finally {
      setStartingOrderId(null)
    }
  }
```

- [ ] **Step 3: Add chat + Iniciar Boost button to order cards for accepted PAID orders**

The booster dashboard renders orders in the "assigned" tab. When `order.status === 'PAID'` and `order.boosterId === user.id`, this is the "accepted, awaiting credentials" state. After the existing card content for each order in the assigned tab, add the chat:

Find where the assigned orders are rendered (inside `activeTab === 'assigned'` or equivalent). After the order card's main `<CardContent>`, add:

```tsx
{order.status === 'PAID' && (
  <div className="mt-4 border-t border-white/10 pt-4">
    <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <p className="text-yellow-300 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        Aguardando credenciais Steam do cliente. Peça ao cliente para enviar pelo chat abaixo.
      </p>
    </div>
    <OrderChat
      orderId={order.id}
      onMessagesUpdate={(messages) => {
        const hasCreds = messages.some(
          (m) => m.messageType === 'STEAM_CREDENTIALS' && !m.isExpired
        )
        setHasCredentialsMap((prev) => ({ ...prev, [order.id]: hasCreds }))
      }}
    />
    <div className="mt-3 flex justify-end">
      <Button
        onClick={() => handleStartOrder(order.id)}
        disabled={!hasCredentialsMap[order.id] || startingOrderId === order.id}
        className="bg-green-600 hover:bg-green-500 text-white font-bold disabled:opacity-40"
        title={!hasCredentialsMap[order.id] ? 'Aguardando credenciais Steam do cliente' : undefined}
      >
        {startingOrderId === order.id ? (
          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Iniciando...</>
        ) : (
          'Iniciar Boost'
        )}
      </Button>
    </div>
  </div>
)}
```

For `IN_PROGRESS` orders, also show the chat:

```tsx
{order.status === 'IN_PROGRESS' && (
  <div className="mt-4 border-t border-white/10 pt-4">
    <OrderChat orderId={order.id} />
  </div>
)}
```

`RefreshCw` is already imported in this file.

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/booster/page.tsx
git commit -m "feat(#2): show chat and Iniciar Boost button in booster dashboard for accepted orders"
```

---

## Task 15: Feature #2 — Client dashboard: show chat for PAID+boosterId orders

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add OrderChat import**

```typescript
import { OrderChat } from '@/components/order/order-chat'
```

- [ ] **Step 2: Add chat to PAID orders where boosterId is set**

In the orders list render, find where each order card is rendered (`filteredOrders.map(...)`). Inside the card, after the existing order info content, add:

```tsx
{/* Chat: shown when booster has been assigned (PAID+boosterId) or order is IN_PROGRESS */}
{(order.status === 'PAID' && order.boosterId) && (
  <div className="mt-4 border-t border-white/10 pt-4">
    <div className="mb-3 p-3 bg-brand-purple/10 border border-brand-purple/30 rounded-lg">
      <p className="text-brand-purple-light text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        Seu booster está pronto! Envie suas credenciais Steam pelo chat para iniciar o boost.
      </p>
    </div>
    <OrderChat orderId={order.id} />
  </div>
)}
{order.status === 'IN_PROGRESS' && (
  <div className="mt-4 border-t border-white/10 pt-4">
    <OrderChat orderId={order.id} />
  </div>
)}
```

The `Order` type at `src/types/index.ts` already has `boosterId?: number | null`, so no type changes needed.

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | grep -E "error TS|Error:" | head -20
```

- [ ] **Step 4: Final full build + lint**

```bash
npm run build 2>&1 | tail -20
npm run lint 2>&1 | grep -E "error|Error" | head -20
```

Expected: clean build, no lint errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(#2): show chat in client dashboard for PAID+boosterId and IN_PROGRESS orders"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| PIX key required to accept (server) | Task 2 |
| PIX banner + disabled button (UI) | Task 3 |
| Standalone `/booster/withdraw` | Task 5 |
| Standalone `/admin/withdraw` | Task 6 |
| Saques removed from payments tabs | Tasks 5, 6 |
| Saques in sidebar for both roles | Task 7 |
| `GET /api/user/retention` | Task 8 |
| `/dashboard/retencao` page | Task 9 |
| Dashboard "Ver programa de fidelidade" link | Task 9 |
| `hasCredentials()` on ChatService | Task 10 |
| `isChatEnabled` for PAID+boosterId | Task 10 |
| `acceptOrder` keeps PAID + auto-creates chat | Task 11 |
| `startOrder` validates credentials + transitions | Task 11 |
| `POST /api/booster/orders/[id]/start` | Task 12 |
| OrderChat `onMessagesUpdate` prop | Task 13 |
| Booster dashboard: chat + Iniciar Boost | Task 14 |
| Client dashboard: chat for PAID+boosterId | Task 15 |
