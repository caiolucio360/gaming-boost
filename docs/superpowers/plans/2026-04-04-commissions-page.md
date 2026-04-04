# Commissions Management Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a centralized `/admin/commissions` page for managing commission percentages, remove hardcoded fallbacks, and clean up the split config form from `/admin/payments`.

**Architecture:** Fix `order.service.ts` to error on missing config instead of using hardcoded defaults. Update the API route for commission-config to accept `devAdminPercentage` and derive `adminPercentage`. Build the new page with two blocks: global config form + booster table with inline overrides.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma, shadcn/ui, Tailwind CSS v4 with design system tokens (`bg-surface-card`, `text-primary`, `bg-action-primary`, etc.), react-hook-form, Zod.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/services/order.service.ts:269-312` | Remove hardcoded fallbacks, error on missing config |
| Modify | `prisma/seed.ts:91-114` | Fix seed to use `boosterPercentage: 0.25`, `devAdminPercentage: 0.10` |
| Modify | `src/app/api/admin/commission-config/route.ts` | Accept `devAdminPercentage`, remove `adminPercentage` sum validation, derive admin% |
| Create | `src/app/admin/commissions/page.tsx` | New page with global config + booster table |
| Modify | `src/app/admin/payments/page.tsx` | Remove config form from Configurações tab, replace with link |
| Modify | `src/app/admin/page.tsx` | Add Comissões quick-link card |

---

## Task 1: Fix `order.service.ts` — remove hardcoded fallbacks

**Files:**
- Modify: `src/services/order.service.ts:269-312`

- [ ] **Step 1: Open the file and locate `getCommissionConfig`**

The current function at line ~269 has these hardcoded fallbacks:
```typescript
let boosterPercentage = 0.70
let adminPercentage = 0.30
let devAdminPercentage = 0
```

- [ ] **Step 2: Replace the entire `getCommissionConfig` method**

Replace the method body (lines 269–312) with:

```typescript
async getCommissionConfig(boosterId?: number): Promise<Result<{ boosterPercentage: number; adminPercentage: number; devAdminPercentage: number }>> {
  try {
    const config = await prisma.commissionConfig.findFirst({
      where: { enabled: true },
    })

    if (!config) {
      return failure('Configuração de comissão não encontrada. Execute o seed do banco de dados.', ErrorCodes.DATABASE_ERROR)
    }

    let boosterPercentage = config.boosterPercentage
    const devAdminPercentage = config.devAdminPercentage || 0
    // adminPercentage is always derived — never read from DB
    let adminPercentage = 1 - boosterPercentage

    // Per-booster override: if set, use it; admin gets the remainder
    if (boosterId) {
      const booster = await prisma.user.findUnique({
        where: { id: boosterId },
        select: { boosterCommissionPercentage: true },
      })

      if (booster?.boosterCommissionPercentage !== null && booster?.boosterCommissionPercentage !== undefined) {
        boosterPercentage = booster.boosterCommissionPercentage
        adminPercentage = 1 - boosterPercentage
      }
    }

    return success({
      boosterPercentage,
      adminPercentage,
      devAdminPercentage,
    })
  } catch (error) {
    console.error('Error getting commission config:', error)
    return failure('Erro ao buscar configuração de comissão', ErrorCodes.DATABASE_ERROR)
  }
},
```

- [ ] **Step 3: Run the build to verify no TypeScript errors**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```
Expected: no TypeScript errors related to this file.

- [ ] **Step 4: Commit**

```bash
git add src/services/order.service.ts
git commit -m "fix: remove hardcoded commission fallbacks, error on missing config"
```

---

## Task 2: Fix seed — correct default percentages

**Files:**
- Modify: `prisma/seed.ts:91-114`

- [ ] **Step 1: Update the CommissionConfig seed block**

Replace the entire section from `// 3. COMMISSION CONFIG` (line ~91) through the closing `}` of the if/else block (line ~114) with:

```typescript
// 3. COMMISSION CONFIG
console.log('\n💰 Creating commission config...')
const existingConfig = await prisma.commissionConfig.findFirst({ where: { enabled: true } })
if (!existingConfig) {
    await prisma.commissionConfig.create({
        data: {
            boosterPercentage: 0.25,
            adminPercentage: 0.75, // stored for DB compat, always derived in code as 1 - boosterPercentage
            devAdminPercentage: 0.10,
            enabled: true
        },
    })
    console.log('  ✓ Commission: 25% booster / 75% admin / 10% dev-admin (off-the-top)')
} else {
    await prisma.commissionConfig.update({
        where: { id: existingConfig.id },
        data: {
            boosterPercentage: 0.25,
            adminPercentage: 0.75,
            devAdminPercentage: 0.10,
        }
    })
    console.log('  ✓ Commission config updated to: 25% booster / 75% admin / 10% dev-admin')
}
```

Also update the booster seed user — remove the hardcoded `boosterCommissionPercentage: 0.70` override so the seed booster inherits the global default:

```typescript
const booster = await prisma.user.upsert({
    where: { email: 'booster@gameboost.com' },
    update: {},
    create: {
        email: 'booster@gameboost.com',
        name: 'Booster Pro',
        password: await bcrypt.hash('booster123', 10),
        role: 'BOOSTER',
        pixKey: '11988888888',
        // no boosterCommissionPercentage override — inherits global
    },
})
```

- [ ] **Step 2: Commit**

```bash
git add prisma/seed.ts
git commit -m "fix: update seed commission defaults to 25% booster / 10% dev-admin"
```

---

## Task 3: Update commission-config API route

**Files:**
- Modify: `src/app/api/admin/commission-config/route.ts`

- [ ] **Step 1: Replace the entire file content**

The current route has problems: GET creates a config with hardcoded 0.70/0.30 if missing, PUT validates that `boosterPercentage + adminPercentage = 1` (no longer valid since admin is derived). Replace the whole file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import { createApiErrorResponse } from '@/lib/api-errors'

// GET - Fetch active commission config
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const config = await prisma.commissionConfig.findFirst({
      where: { enabled: true },
    })

    if (!config) {
      return NextResponse.json(
        { message: 'Configuração de comissão não encontrada. Execute o seed.' },
        { status: 404 }
      )
    }

    // Always derive adminPercentage — never trust the stored value
    const enriched = {
      ...config,
      adminPercentage: 1 - config.boosterPercentage,
    }

    return NextResponse.json({ config: enriched }, { status: 200 })
  } catch (error) {
    return createApiErrorResponse(error, 'Erro ao buscar configuração de comissão', 'GET /api/admin/commission-config')
  }
}

// PUT - Update commission config
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const body = await request.json()
    const { boosterPercentage, devAdminPercentage, withdrawalWaitingDays } = body

    if (boosterPercentage === undefined || devAdminPercentage === undefined) {
      return NextResponse.json(
        { message: 'boosterPercentage e devAdminPercentage são obrigatórios' },
        { status: 400 }
      )
    }

    if (boosterPercentage < 0 || boosterPercentage > 1) {
      return NextResponse.json(
        { message: 'boosterPercentage deve estar entre 0 e 1' },
        { status: 400 }
      )
    }

    if (devAdminPercentage < 0 || devAdminPercentage > 1) {
      return NextResponse.json(
        { message: 'devAdminPercentage deve estar entre 0 e 1' },
        { status: 400 }
      )
    }

    if (withdrawalWaitingDays !== undefined &&
        (!Number.isInteger(withdrawalWaitingDays) || withdrawalWaitingDays < 0)) {
      return NextResponse.json(
        { message: 'withdrawalWaitingDays deve ser um inteiro não negativo' },
        { status: 400 }
      )
    }

    // adminPercentage stored as 1 - boosterPercentage for DB compatibility
    const adminPercentage = 1 - boosterPercentage

    const config = await prisma.$transaction(async (tx: any) => {
      await tx.commissionConfig.updateMany({
        where: { enabled: true },
        data: { enabled: false },
      })

      return tx.commissionConfig.create({
        data: {
          boosterPercentage,
          adminPercentage,
          devAdminPercentage,
          ...(withdrawalWaitingDays !== undefined && { withdrawalWaitingDays }),
          enabled: true,
        },
      })
    })

    return NextResponse.json(
      {
        message: 'Configuração atualizada com sucesso',
        config: { ...config, adminPercentage: 1 - config.boosterPercentage },
      },
      { status: 200 }
    )
  } catch (error) {
    return createApiErrorResponse(error, 'Erro ao atualizar configuração de comissão', 'PUT /api/admin/commission-config')
  }
}
```

- [ ] **Step 2: Run the build to verify no TypeScript errors**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/commission-config/route.ts
git commit -m "fix: commission-config API derives adminPercentage, accepts devAdminPercentage"
```

---

## Task 4: Create `/admin/commissions` page

**Files:**
- Create: `src/app/admin/commissions/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ArrowLeft, Save, Pencil, X, Check, Percent } from 'lucide-react'
import Link from 'next/link'
import { showSuccess, showError } from '@/lib/toast'
import { formatPrice } from '@/lib/utils'

interface CommissionConfig {
  id: number
  boosterPercentage: number
  adminPercentage: number
  devAdminPercentage: number
  withdrawalWaitingDays: number
}

interface Booster {
  id: number
  name: string | null
  email: string
  image: string | null
  boosterCommissionPercentage: number | null
}

const PREVIEW_AMOUNT = 100

export default function AdminCommissionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { loading, withLoading } = useLoading({ initialLoading: true })

  // Config state
  const [config, setConfig] = useState<CommissionConfig | null>(null)
  const [devAdminInput, setDevAdminInput] = useState('')
  const [boosterInput, setBoosterInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [configAlert, setConfigAlert] = useState<{ title: string; description: string; variant: 'default' | 'destructive' } | null>(null)

  // Booster table state
  const [boosters, setBoosters] = useState<Booster[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingBooster, setSavingBooster] = useState<number | null>(null)

  const isDevAdmin = user?.isDevAdmin === true
  const canEdit = !isDevAdmin // only non-dev admins can edit

  // ─── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
    else if (!authLoading && user && user.role !== 'ADMIN') {
      router.replace(user.role === 'BOOSTER' ? '/booster' : '/dashboard')
    }
  }, [user, authLoading, router])

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    withLoading(async () => {
      await Promise.all([fetchConfig(), fetchBoosters()])
    })
  }, [user])

  const fetchConfig = async () => {
    const response = await fetch('/api/admin/commission-config')
    if (response.ok) {
      const data = await response.json()
      setConfig(data.config)
      setDevAdminInput(String(Math.round(data.config.devAdminPercentage * 100)))
      setBoosterInput(String(Math.round(data.config.boosterPercentage * 100)))
    }
  }

  const fetchBoosters = async () => {
    const response = await fetch('/api/admin/users?role=BOOSTER&limit=100')
    if (response.ok) {
      const data = await response.json()
      setBoosters(data.users || [])
    }
  }

  // ─── Derived preview values ────────────────────────────────────────────────
  const devPct = parseFloat(devAdminInput) || 0
  const boosterPct = parseFloat(boosterInput) || 0
  const adminPct = 100 - boosterPct
  const remaining = PREVIEW_AMOUNT * (1 - devPct / 100)
  const previewDev = PREVIEW_AMOUNT * (devPct / 100)
  const previewBooster = remaining * (boosterPct / 100)
  const previewAdmin = remaining * (adminPct / 100)

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    setConfigAlert(null)
    const dev = parseFloat(devAdminInput)
    const booster = parseFloat(boosterInput)

    if (isNaN(dev) || isNaN(booster)) {
      setConfigAlert({ title: 'Erro', description: 'Porcentagens devem ser números válidos', variant: 'destructive' })
      return
    }
    if (dev < 0 || dev > 100 || booster < 0 || booster > 100) {
      setConfigAlert({ title: 'Erro', description: 'Porcentagens devem estar entre 0 e 100', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/commission-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boosterPercentage: booster / 100,
          devAdminPercentage: dev / 100,
          withdrawalWaitingDays: config?.withdrawalWaitingDays ?? 7,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setConfig(data.config)
        showSuccess('Configuração salva com sucesso!')
      } else {
        setConfigAlert({ title: 'Erro', description: data.message || 'Erro ao salvar', variant: 'destructive' })
      }
    } catch {
      showError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (booster: Booster) => {
    setEditingId(booster.id)
    const current = booster.boosterCommissionPercentage
    setEditValue(current !== null && current !== undefined ? String(Math.round(current * 100)) : '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveBoosterOverride = async (boosterId: number) => {
    setSavingBooster(boosterId)
    const value = editValue.trim()
    const percentage = value === '' ? null : parseFloat(value) / 100

    if (percentage !== null && (isNaN(percentage) || percentage < 0 || percentage > 1)) {
      showError('Porcentagem deve estar entre 0 e 100')
      setSavingBooster(null)
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${boosterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boosterCommissionPercentage: percentage }),
      })
      const data = await response.json()
      if (response.ok) {
        setBoosters(prev => prev.map(b =>
          b.id === boosterId ? { ...b, boosterCommissionPercentage: percentage } : b
        ))
        setEditingId(null)
        showSuccess(percentage === null ? 'Override removido — usando padrão global' : 'Porcentagem atualizada')
      } else {
        showError(data.message || 'Erro ao atualizar')
      }
    } catch {
      showError('Erro de conexão')
    } finally {
      setSavingBooster(null)
    }
  }

  const getBoosterPct = (booster: Booster) => {
    if (booster.boosterCommissionPercentage !== null && booster.boosterCommissionPercentage !== undefined) {
      return booster.boosterCommissionPercentage
    }
    return config ? config.boosterPercentage : 0.25
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen bg-surface-page py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="text-brand-purple-light hover:text-brand-purple-light mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Dashboard
            </Button>
          </Link>
        </div>

        <PageHeader
          highlight="COMISSÕES"
          title="GERENCIAR"
          description="Configure as porcentagens de comissão. Mudanças afetam apenas pedidos futuros."
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-8">

            {/* ── Block 1: Global Config ──────────────────────────────────── */}
            <Card className="bg-surface-card border-border-default">
              <CardHeader>
                <CardTitle className="text-primary font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Configuração Global
                </CardTitle>
                <CardDescription className="text-muted font-rajdhani">
                  {canEdit ? 'Define os padrões para todos os boosters sem override individual.' : 'Visualização somente leitura.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-secondary font-rajdhani">% Dev-Admin (off-the-top)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={devAdminInput}
                        onChange={e => setDevAdminInput(e.target.value)}
                        disabled={!canEdit}
                        className="bg-surface-card border-border-default focus:border-border-brand text-primary"
                      />
                      <Percent className="h-4 w-4 text-muted flex-shrink-0" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-secondary font-rajdhani">% Booster padrão</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={boosterInput}
                        onChange={e => setBoosterInput(e.target.value)}
                        disabled={!canEdit}
                        className="bg-surface-card border-border-default focus:border-border-brand text-primary"
                      />
                      <Percent className="h-4 w-4 text-muted flex-shrink-0" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-secondary font-rajdhani">% Admin (automático)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={isNaN(adminPct) ? '' : adminPct.toFixed(0)}
                        disabled
                        className="bg-surface-subtle border-border-default text-muted cursor-not-allowed"
                      />
                      <Percent className="h-4 w-4 text-muted flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted">= 100% − % Booster</p>
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded-lg bg-surface-subtle border border-border-default p-4">
                  <p className="text-secondary font-rajdhani text-sm mb-3">
                    Simulação em {formatPrice(PREVIEW_AMOUNT)}:
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted font-rajdhani">Dev-Admin</p>
                      <p className="text-primary font-orbitron font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {formatPrice(previewDev)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted font-rajdhani">Booster</p>
                      <p className="text-primary font-orbitron font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {formatPrice(previewBooster)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted font-rajdhani">Admin</p>
                      <p className="text-primary font-orbitron font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {formatPrice(previewAdmin)}
                      </p>
                    </div>
                  </div>
                </div>

                {configAlert && (
                  <Alert variant={configAlert.variant}>
                    <AlertTitle>{configAlert.title}</AlertTitle>
                    <AlertDescription>{configAlert.description}</AlertDescription>
                  </Alert>
                )}

                {canEdit && (
                  <Button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="bg-action-primary hover:bg-action-primary-hover text-on-brand"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Configuração'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* ── Block 2: Booster Table ──────────────────────────────────── */}
            <Card className="bg-surface-card border-border-default">
              <CardHeader>
                <CardTitle className="text-primary font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Boosters
                </CardTitle>
                <CardDescription className="text-muted font-rajdhani">
                  Overrides individuais. Deixe em branco para usar o padrão global.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {boosters.length === 0 ? (
                  <p className="text-muted font-rajdhani text-center py-8">Nenhum booster ativo encontrado.</p>
                ) : (
                  <div className="space-y-3">
                    {boosters.map(booster => {
                      const pct = getBoosterPct(booster)
                      const adminResultante = 100 - Math.round(pct * 100)
                      const hasOverride = booster.boosterCommissionPercentage !== null && booster.boosterCommissionPercentage !== undefined
                      const isEditing = editingId === booster.id

                      return (
                        <div
                          key={booster.id}
                          className="flex items-center gap-4 p-3 rounded-lg border border-border-default bg-surface-subtle hover:border-border-brand transition-colors"
                        >
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage src={booster.image || ''} />
                            <AvatarFallback className="bg-action-strong text-on-brand text-xs">
                              {booster.name?.substring(0, 2).toUpperCase() || 'BO'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="text-primary font-rajdhani font-medium truncate">
                              {booster.name || booster.email}
                            </p>
                            <p className="text-muted text-xs font-rajdhani truncate">{booster.email}</p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder={`padrão (${Math.round((config?.boosterPercentage ?? 0.25) * 100)}%)`}
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  className="w-28 bg-surface-card border-border-brand text-primary h-8 text-sm"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => saveBoosterOverride(booster.id)}
                                  disabled={savingBooster === booster.id}
                                  className="bg-action-primary hover:bg-action-primary-hover text-on-brand h-8 w-8 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEdit}
                                  className="text-muted hover:text-primary h-8 w-8 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="text-right">
                                  <div className="flex items-center gap-1">
                                    <span className="text-primary font-orbitron text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                      {Math.round(pct * 100)}%
                                    </span>
                                    {hasOverride && (
                                      <Badge className="text-[10px] bg-brand-purple/20 text-brand-purple-light border-brand-purple/30 py-0">
                                        override
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted text-xs font-rajdhani">admin: {adminResultante}%</p>
                                </div>
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEdit(booster)}
                                    className="text-muted hover:text-brand h-8 w-8 p-0"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run the build**

```bash
npm run build 2>&1 | grep -E "error TS|Error|error"
```
Expected: no errors in `src/app/admin/commissions/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/commissions/page.tsx
git commit -m "feat: add /admin/commissions page with global config and booster table"
```

---

## Task 5: Clean up `/admin/payments` Configurações tab

**Files:**
- Modify: `src/app/admin/payments/page.tsx`

- [ ] **Step 1: Read the current Configurações tab section**

Search for `TabsContent value="configuracoes"` in `src/app/admin/payments/page.tsx`. The section contains the full commission config form (inputs for boosterPercentage, adminPercentage, withdrawalWaitingDays, save button, alert, and example preview).

- [ ] **Step 2: Replace the entire Configurações TabsContent**

Find the block starting with `{/* ── Tab: Configurações ─` and replace its entire `<TabsContent value="configuracoes">...</TabsContent>` with:

```tsx
<TabsContent value="configuracoes">
  <Card className="bg-surface-card border-border-default">
    <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
      <p className="text-secondary font-rajdhani text-center max-w-sm">
        As configurações de comissão foram movidas para uma página dedicada.
      </p>
      <Link href="/admin/commissions">
        <Button className="bg-action-primary hover:bg-action-primary-hover text-on-brand">
          Ir para Gerenciar Comissões
        </Button>
      </Link>
    </CardContent>
  </Card>
</TabsContent>
```

- [ ] **Step 3: Remove unused state variables**

Remove all state and handlers that are now only used by the old config form and no longer needed in this file. Specifically remove:
- `const [config, setConfig] = useState(...)` (if only used in config tab)
- `const [boosterPercentage, setBoosterPercentage] = useState(...)`
- `const [adminPercentage, setAdminPercentage] = useState(...)`
- `const [withdrawalWaitingDays, setWithdrawalWaitingDays] = useState(...)`
- `const [saving, setSaving] = useState(false)`
- `const [configAlert, setConfigAlert] = useState(...)`
- `const { loading: configLoading, withLoading: withConfigLoading } = useLoading(...)`
- `const fetchCommissionConfig = async () => {...}`
- `const handleSaveConfig = async () => {...}`
- `const percentSum = ...`
- Remove `fetchCommissionConfig()` from the `useEffect` mount call

Also remove unused imports that were only for the config form (check which are now orphaned).

- [ ] **Step 4: Run the build**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```
Fix any TypeScript errors from removed state/imports.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/payments/page.tsx
git commit -m "refactor: replace commission config form in payments with link to /admin/commissions"
```

---

## Task 6: Add Comissões link to admin dashboard

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Find the quick-links grid**

In `src/app/admin/page.tsx`, find the section with quick-link cards (the grid that has links to `/admin/orders`, `/admin/users`, `/admin/pricing`, `/admin/payments`).

- [ ] **Step 2: Add a Comissões card**

Add the following card to the grid (alongside the existing quick-link cards):

```tsx
<Link href="/admin/commissions">
  <Card className="bg-surface-card border-border-default hover:border-border-brand transition-colors cursor-pointer group">
    <CardContent className="p-6 flex items-center gap-4">
      <div className="p-3 rounded-lg bg-action-primary/10 group-hover:bg-action-primary/20 transition-colors">
        <Percent className="h-6 w-6 text-brand" />
      </div>
      <div>
        <h3 className="text-primary font-rajdhani font-semibold">Comissões</h3>
        <p className="text-muted text-sm font-rajdhani">Gerenciar porcentagens</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted ml-auto group-hover:text-brand transition-colors" />
    </CardContent>
  </Card>
</Link>
```

- [ ] **Step 3: Add `Percent` to the lucide-react imports**

At the top of `src/app/admin/page.tsx`, add `Percent` to the existing lucide-react import line.

- [ ] **Step 4: Run the build**

```bash
npm run build 2>&1 | grep -E "error TS|Error"
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add Comissões quick-link to admin dashboard"
```

---

## Task 7: Update middleware route protection

**Files:**
- Read: `src/middleware.ts`

- [ ] **Step 1: Verify `/admin/commissions` is covered**

Open `src/middleware.ts` and check the admin route pattern. It should already be `/admin/*` which covers `/admin/commissions`. If the pattern is more specific (e.g., an explicit allowlist), add `/admin/commissions` to it.

```bash
grep -n "admin" src/middleware.ts
```
Expected: a pattern like `/admin` with a wildcard that covers all subroutes. If it already covers `/admin/*`, no change needed — just confirm and move on.

- [ ] **Step 2: Commit only if a change was needed**

```bash
# Only if middleware was changed:
git add src/middleware.ts
git commit -m "fix: ensure /admin/commissions is protected by middleware"
```

---

## Task 8: Final build and tests

- [ ] **Step 1: Run full build**

```bash
npm run build 2>&1
```
Expected: `✓ Compiled successfully` with no TypeScript errors. If errors exist, fix them before proceeding.

- [ ] **Step 2: Run tests**

```bash
npm test -- --passWithNoTests 2>&1 | tail -15
```
Expected: all tests pass, `0 failed`.

- [ ] **Step 3: Final commit if any last fixes were made**

```bash
git add -A
git status  # verify only expected files
git commit -m "fix: resolve build/test issues in commissions feature"
```

---

## Self-Review Checklist

- [x] **Task 1** covers spec: "Remove hardcoded fallbacks, error on missing config"
- [x] **Task 2** covers spec: "Seed with boosterPercentage: 0.25, devAdminPercentage: 0.10"
- [x] **Task 3** covers spec: "API derives adminPercentage, accepts devAdminPercentage"
- [x] **Task 4** covers spec: Block 1 (global config + live preview), Block 2 (booster table with inline edit), access control (dev-admin read-only, admin edits)
- [x] **Task 5** covers spec: "Remove commission config form from /admin/payments Configurações tab"
- [x] **Task 6** covers spec: "Add Comissões link to admin navigation"
- [x] **Task 7** covers spec: "Access control — Booster/Client redirected"
- [x] **Task 8** covers: build + tests verification
- [x] Design system tokens used throughout Task 4: `bg-surface-card`, `bg-surface-page`, `bg-surface-subtle`, `text-primary`, `text-secondary`, `text-muted`, `text-brand`, `bg-action-primary`, `hover:bg-action-primary-hover`, `text-on-brand`, `border-border-default`, `border-border-brand`, `bg-action-strong`, `font-orbitron`, `font-rajdhani`
- [x] No hardcoded hex values in any task
- [x] No TBDs or incomplete steps
- [x] Type names consistent across tasks (`CommissionConfig`, `Booster`, `getBoosterPct`)
