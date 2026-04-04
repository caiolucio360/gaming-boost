# CS2 Calculator Service Selection UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat service type tabs with a two-phase selection flow: large visual cards first, then the full calculator reveals after a service is chosen.

**Architecture:** Single-file change to `src/components/games/cs2-calculator.tsx`. State type for `selectedServiceType` changes from `ServiceType` to `ServiceType | null` (null = nothing chosen yet). Phase A renders full cards; Phase B renders a compact pill bar. The calculator body is hidden until a service type is selected.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS v4, lucide-react

---

## File Map

| File | Change |
|------|--------|
| `src/components/games/cs2-calculator.tsx` | All changes — state type, imports, Phase A/B UI, reveal wrapper |

---

### Task 1: Implement two-phase service type selection

**Files:**
- Modify: `src/components/games/cs2-calculator.tsx`

No tests exist for this component and there is no test file to create. Verification is done by running the build.

- [ ] **Step 1: Update the lucide-react import**

  Find the current import (line 13):
  ```ts
  import { AlertCircle, Calculator, Zap } from 'lucide-react'
  ```
  Replace with:
  ```ts
  import { AlertCircle, Calculator, Check, Sword, Users, Zap } from 'lucide-react'
  ```

- [ ] **Step 2: Update selectedServiceType state type and initial value**

  Find (line 28):
  ```ts
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>('RANK_BOOST')
  ```
  Replace with:
  ```ts
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)
  ```

- [ ] **Step 3: Fix the serviceTypeInfo derivation to handle null**

  Find (line 44):
  ```ts
  const serviceTypeInfo = gameConfig?.serviceTypeInfo?.[selectedServiceType]
  ```
  Replace with:
  ```ts
  const serviceTypeInfo = selectedServiceType ? gameConfig?.serviceTypeInfo?.[selectedServiceType] : undefined
  ```

- [ ] **Step 4: Replace the Service Type Selector block with Phase A / Phase B**

  Find and delete the entire existing Service Type Selector block (the one that renders `<Tabs>` with RANK_BOOST and DUO_BOOST triggers — starts with `{/* Service Type Selector */}` and ends with the closing `</div>` of that section, before the `{/* Service Type Description */}` comment).

  In its place, insert this block:

  ```tsx
  {/* Service Type Selection — Phase A (full cards) or Phase B (compact bar) */}
  {selectedServiceType === null ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {([
        {
          type: 'RANK_BOOST' as ServiceType,
          Icon: Sword,
          title: 'Rank Boost',
          description: 'Nosso booster joga por você e sobe seu rank profissionalmente.',
        },
        {
          type: 'DUO_BOOST' as ServiceType,
          Icon: Users,
          title: 'Duo Boost',
          description: 'Você joga ao lado de um booster profissional para subir juntos.',
        },
      ] as const).map(({ type, Icon, title, description }) => (
        <button
          key={type}
          onClick={() => handleServiceTypeChange(type)}
          className="bg-brand-black-light border border-brand-purple/30 rounded-xl p-6 cursor-pointer
            hover:border-brand-purple hover:shadow-glow transition-all duration-300
            flex flex-col items-center text-center"
        >
          <Icon className="h-10 w-10 text-brand-purple-light mb-3" />
          <h3 className="text-lg font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {title}
          </h3>
          <p className="text-sm text-brand-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {description}
          </p>
        </button>
      ))}
    </div>
  ) : (
    <div className="flex flex-wrap gap-2 mb-4">
      {(gameConfig.supportedServiceTypes as ServiceType[]).map((type) => {
        const info = gameConfig.serviceTypeInfo?.[type]
        const isSelected = selectedServiceType === type
        const Icon = type === 'RANK_BOOST' ? Sword : Users
        return (
          <button
            key={type}
            onClick={() => handleServiceTypeChange(type)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 font-rajdhani font-bold text-sm
              ${isSelected
                ? 'bg-brand-purple text-white shadow-glow'
                : 'bg-brand-black-light border border-white/10 text-brand-gray-400 hover:border-brand-purple/50 hover:text-white'
              }`}
          >
            <Icon className="h-4 w-4" />
            {info?.displayName || type}
            {isSelected && <Check className="h-4 w-4" />}
          </button>
        )
      })}
    </div>
  )}
  ```

- [ ] **Step 5: Wrap the calculator body in a conditional reveal div**

  Everything after the service type selection block (from `{/* Service Type Description */}` down to and including the closing `</div>` of the `space-y-4` div) must be wrapped in a reveal wrapper.

  Find the `{/* Service Type Description */}` comment. Immediately before it, insert:
  ```tsx
  {selectedServiceType !== null && (
  <div key={selectedServiceType} className="animate-fadeInUp">
  ```

  Then find the closing tag of the outermost `<div className="space-y-4">` block (the one containing the rating grids, calculate button, and price result). After its closing `</div>`, add:
  ```tsx
  </div>
  )}
  ```

  The resulting structure inside `<CardContent>` should be:

  ```tsx
  <CardContent>
    {/* Phase A / Phase B */}
    {selectedServiceType === null ? (
      <div className="grid ...">...</div>
    ) : (
      <div className="flex ...">...</div>
    )}

    {/* Calculator body — only when service type is selected */}
    {selectedServiceType !== null && (
      <div key={selectedServiceType} className="animate-fadeInUp">

        {/* Service Type Description */}
        {serviceTypeInfo && (
          <p ...>{serviceTypeInfo.description}</p>
        )}

        {/* Mode Selector */}
        {gameConfig.modes && Object.keys(gameConfig.modes).length > 1 && (
          <div className="mb-4">
            <Tabs ...>...</Tabs>
          </div>
        )}

        {/* Warning for Active Orders */}
        {user && hasActiveOrderInMode && (
          <Card ...>...</Card>
        )}

        <div className="space-y-4">
          {/* Rating Selection */}
          ...
          {/* Calculate Button and Result */}
          ...
        </div>

      </div>
    )}
  </CardContent>
  ```

- [ ] **Step 6: Verify build passes**

  Run:
  ```bash
  npm run build
  ```

  Expected: Zero TypeScript errors. The build completes successfully.

  Common errors to watch for:
  - `Type 'ServiceType | null' is not assignable to type 'ServiceType'` — fix by checking `selectedServiceType` is non-null before passing to functions that expect `ServiceType`
  - `Property 'X' does not exist on type 'never'` — TypeScript narrowing issue, add explicit type cast

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/games/cs2-calculator.tsx
  git commit -m "feat: two-phase service type selection in CS2 calculator"
  ```
