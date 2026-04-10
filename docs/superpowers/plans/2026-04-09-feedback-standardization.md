# Feedback Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o padrão `alert state + setAlert + setTimeout` por `showSuccess`/`showError` toasts em 5 páginas do sistema.

**Architecture:** Cada task é independente — um arquivo por task. O padrão é sempre o mesmo: remover `useState` do alert, remover o bloco JSX do Alert, remover imports desnecessários, e substituir cada `setAlert(...)` + `setTimeout(() => setAlert(null))` pelo toast correspondente.

**Tech Stack:** Next.js 15, React, Sonner (`showSuccess`/`showError` de `@/lib/toast`), shadcn/ui Alert (mantido apenas onde correto).

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `src/app/booster/page.tsx` | Remover `alert` state + JSX + imports; substituir 7 `setAlert` por toasts |
| `src/app/admin/users/page.tsx` | Remover `alert` state + JSX + imports; substituir ~14 `setAlert` por toasts; adicionar import de toast |
| `src/app/admin/orders/page.tsx` | Remover `alert` state + JSX + imports; substituir 3 `setAlert` por toasts; adicionar import de toast |
| `src/app/profile/page.tsx` | Remover `alert` state + JSX + imports Alert (manter AlertDialog); substituir ~6 `setAlert` por toasts |
| `src/app/dashboard/page.tsx` | Remover apenas: `alert` state, JSX do Alert, imports Alert/AlertDescription/AlertTitle/AlertCircle |

---

## Task 1: `src/app/booster/page.tsx`

**Arquivo:** `src/app/booster/page.tsx`

- [ ] **Passo 1: Remover o `alert` state (linha 99)**

  Localizar e remover esta linha:
  ```tsx
  const [alert, setAlert] = useState<{ title: string; description: string; variant: 'default' | 'destructive' } | null>(null)
  ```

- [ ] **Passo 2: Substituir os 7 `setAlert` + `setTimeout` por toasts**

  **2a — Aceitar pedido (sucesso):** Localizar (≈linhas 258–264):
  ```tsx
  setAlert({
    title: 'Sucesso',
    description: 'Pedido aceito com sucesso!',
    variant: 'default',
  })
  fetchOrders(true) // Refresh sem loading completo
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showSuccess('Pedido aceito com sucesso!')
  fetchOrders(true)
  ```

  **2b — Aceitar pedido (erro API):** Localizar (≈linhas 267–272):
  ```tsx
  setAlert({
    title: 'Erro',
    description: data.message || 'Erro ao aceitar pedido',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao aceitar pedido', data.message || 'Tente novamente.')
  ```

  **2c — Aceitar pedido (erro catch):** Localizar (≈linhas 276–281):
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Erro ao aceitar pedido',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao aceitar pedido')
  ```

  **2d — Upload de prova (erro):** Localizar (≈linhas 324–329):
  ```tsx
  setAlert({
    title: 'Erro no upload',
    description: uploadData.message || 'Erro ao enviar o print. Tente novamente.',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 6000)
  return
  ```
  Substituir por:
  ```tsx
  showError('Erro no upload', uploadData.message || 'Erro ao enviar o print. Tente novamente.')
  return
  ```

  **2e — Concluir pedido (sucesso):** Localizar (≈linhas 349–355):
  ```tsx
  setAlert({
    title: 'Sucesso',
    description: 'Pedido marcado como concluído!',
    variant: 'default',
  })
  fetchOrders(true)
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showSuccess('Pedido marcado como concluído!')
  fetchOrders(true)
  ```

  **2f — Concluir pedido (erro API):** Localizar (≈linhas 358–363):
  ```tsx
  setAlert({
    title: 'Erro',
    description: data.message || 'Erro ao atualizar pedido',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao concluir pedido', data.message || 'Tente novamente.')
  ```

  **2g — Concluir pedido (erro catch):** Localizar (≈linhas 367–372):
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Erro ao concluir pedido',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao concluir pedido')
  ```

- [ ] **Passo 3: Remover o bloco JSX do Alert (≈linhas 391–396)**

  Localizar e remover completamente:
  ```tsx
  {alert && (
    <Alert variant={alert.variant} className="mb-4">
      <AlertTitle>{alert.title}</AlertTitle>
      <AlertDescription>{alert.description}</AlertDescription>
    </Alert>
  )}
  ```

- [ ] **Passo 4: Remover imports de Alert**

  Localizar (≈linhas 37–40):
  ```tsx
  import {
    Alert,
    AlertDescription,
    AlertTitle,
  } from '@/components/ui/alert'
  ```
  Remover essas linhas completamente. O import de `showSuccess, showError` de `@/lib/toast` já existe na linha 34.

- [ ] **Passo 5: Verificar que não restam referências a `alert` ou `setAlert`**

  Fazer uma busca visual pelo arquivo por `setAlert`, `alert.variant`, `alert.title`, `alert.description`. Se encontrar alguma, corrigir.

- [ ] **Passo 6: Commit**

  ```bash
  git add src/app/booster/page.tsx
  git commit -m "fix: substituir alert state por toasts no dashboard do booster"
  ```

---

## Task 2: `src/app/admin/orders/page.tsx`

**Arquivo:** `src/app/admin/orders/page.tsx`

- [ ] **Passo 1: Adicionar import de toast**

  Localizar a linha do import de `LoadingSpinner` (≈linha 20):
  ```tsx
  import { LoadingSpinner } from '@/components/common/loading-spinner'
  ```
  Adicionar após ela:
  ```tsx
  import { showSuccess, showError } from '@/lib/toast'
  ```

- [ ] **Passo 2: Remover o `alert` state (linha 64)**

  Localizar e remover:
  ```tsx
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null)
  ```

- [ ] **Passo 3: Substituir os 3 `setAlert` + `setTimeout` em `handleStatusUpdate`**

  **3a — Sucesso (≈linhas 98–104):**
  ```tsx
  setAlert({
    title: 'Sucesso',
    description: 'Status atualizado com sucesso!',
    variant: 'default',
  })
  fetchOrders()
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showSuccess('Status atualizado com sucesso!')
  fetchOrders()
  ```

  **3b — Erro API (≈linhas 107–112):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: data.message || 'Erro ao atualizar status',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao atualizar status', data.message || 'Tente novamente.')
  ```

  **3c — Erro catch (≈linhas 116–121):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Erro ao atualizar status',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao atualizar status')
  ```

- [ ] **Passo 4: Remover o bloco JSX do Alert (≈linhas 137–142)**

  Localizar e remover:
  ```tsx
  {alert && (
    <Alert variant={alert.variant} className="mb-4">
      <AlertTitle>{alert.title}</AlertTitle>
      <AlertDescription>{alert.description}</AlertDescription>
    </Alert>
  )}
  ```

- [ ] **Passo 5: Remover import de Alert (linha 21)**

  Localizar e remover:
  ```tsx
  import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
  ```

- [ ] **Passo 6: Commit**

  ```bash
  git add src/app/admin/orders/page.tsx
  git commit -m "fix: substituir alert state por toasts em admin/orders"
  ```

---

## Task 3: `src/app/admin/users/page.tsx`

**Arquivo:** `src/app/admin/users/page.tsx`

- [ ] **Passo 1: Adicionar import de toast**

  Localizar o bloco de imports de `Alert` (≈linhas 19–22):
  ```tsx
  import {
    Alert,
    AlertDescription,
    AlertTitle,
  } from '@/components/ui/alert'
  ```
  Substituir por (remove Alert, adiciona toast):
  ```tsx
  import { showSuccess, showError } from '@/lib/toast'
  ```

- [ ] **Passo 2: Remover o `alert` state (linha 75)**

  Localizar e remover:
  ```tsx
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null)
  ```

- [ ] **Passo 3: Substituir `setAlert` em `fetchUsers` (≈linhas 112–127)**

  **3a — Erro fetch API (≈linhas 112–117):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: errorData.message || 'Erro ao buscar usuários',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao buscar usuários', errorData.message || 'Tente novamente.')
  ```

  **3b — Erro catch (≈linhas 122–127):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Erro ao buscar usuários. Tente novamente.',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao buscar usuários', 'Tente novamente.')
  ```

- [ ] **Passo 4: Substituir `setAlert` em `handleDelete` (≈linhas 152–175)**

  **4a — Sucesso (≈linhas 152–158):**
  ```tsx
  setAlert({
    title: 'Sucesso',
    description: 'Usuário deletado com sucesso!',
    variant: 'default',
  })
  fetchUsers(true)
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showSuccess('Usuário deletado com sucesso!')
  fetchUsers(true)
  ```

  **4b — Erro API (≈linhas 161–166):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: data.message || 'Erro ao deletar usuário',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao deletar usuário', data.message || 'Tente novamente.')
  ```

  **4c — Erro catch (≈linhas 170–175):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Erro ao deletar usuário',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao deletar usuário')
  ```

- [ ] **Passo 5: Substituir `setAlert` no Dialog de comissão (≈linhas 511–554)**

  **5a — Validação (≈linhas 511–516):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Porcentagem deve ser um número entre 0 e 100',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  return
  ```
  Substituir por:
  ```tsx
  showError('Erro de validação', 'Porcentagem deve ser um número entre 0 e 100')
  return
  ```

  **5b — Sucesso (≈linhas 530–537):**
  ```tsx
  setAlert({
    title: 'Sucesso',
    description: 'Comissão atualizada com sucesso!',
    variant: 'default',
  })
  setCommissionDialogOpen(false)
  fetchUsers(false)
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showSuccess('Comissão atualizada com sucesso!')
  setCommissionDialogOpen(false)
  fetchUsers(false)
  ```

  **5c — Erro API (≈linhas 540–545):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: data.message || 'Erro ao atualizar comissão',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao atualizar comissão', data.message || 'Tente novamente.')
  ```

  **5d — Erro catch (≈linhas 549–554):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Erro ao atualizar comissão',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao atualizar comissão')
  ```

- [ ] **Passo 6: Substituir `setAlert` no Dialog de profit share (≈linhas 613–655)**

  **6a — Validação (≈linhas 613–618):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'O valor deve ser um número positivo',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  return
  ```
  Substituir por:
  ```tsx
  showError('Erro de validação', 'O valor deve ser um número positivo')
  return
  ```

  **6b — Sucesso (≈linhas 631–638):**
  ```tsx
  setAlert({
    title: 'Sucesso',
    description: 'Profit Share atualizado com sucesso!',
    variant: 'default',
  })
  setProfitShareDialogOpen(false)
  fetchUsers(false)
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showSuccess('Profit Share atualizado com sucesso!')
  setProfitShareDialogOpen(false)
  fetchUsers(false)
  ```

  **6c — Erro API (≈linhas 641–646):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: data.message || 'Erro ao atualizar Profit Share',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao atualizar Profit Share', data.message || 'Tente novamente.')
  ```

  **6d — Erro catch (≈linhas 650–655):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Erro ao atualizar Profit Share',
    variant: 'destructive',
  })
  setTimeout(() => setAlert(null), 5000)
  ```
  Substituir por:
  ```tsx
  showError('Erro ao atualizar Profit Share')
  ```

- [ ] **Passo 7: Remover o bloco JSX do Alert (≈linhas 219–224)**

  Localizar e remover:
  ```tsx
  {alert && (
    <Alert variant={alert.variant} className="mb-4">
      <AlertTitle>{alert.title}</AlertTitle>
      <AlertDescription>{alert.description}</AlertDescription>
    </Alert>
  )}
  ```

- [ ] **Passo 8: Commit**

  ```bash
  git add src/app/admin/users/page.tsx
  git commit -m "fix: substituir alert state por toasts em admin/users"
  ```

---

## Task 4: `src/app/profile/page.tsx`

**Arquivo:** `src/app/profile/page.tsx`

- [ ] **Passo 1: Adicionar import de toast e remover import de Alert**

  Localizar (linha 11):
  ```tsx
  import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
  ```
  Substituir por:
  ```tsx
  import { showSuccess, showError } from '@/lib/toast'
  ```
  
  **Atenção:** Manter o import de `AlertDialog` e afins (linhas 31–40) — são componentes diferentes usados na confirmação de exclusão de conta.

- [ ] **Passo 2: Remover ícones não mais usados dos imports lucide-react**

  Localizar (≈linhas 13–24):
  ```tsx
  import { 
    User as UserIcon,
    Mail,
    Phone,
    Save,
    AlertCircle,
    CheckCircle2,
    Lock,
    CreditCard,
    Trash2,
    AlertTriangle
  } from 'lucide-react'
  ```
  Substituir por (remove `AlertCircle` e `CheckCircle2` que eram usados apenas no Alert):
  ```tsx
  import { 
    User as UserIcon,
    Mail,
    Phone,
    Save,
    Lock,
    CreditCard,
    Trash2,
    AlertTriangle
  } from 'lucide-react'
  ```
  
  **Nota:** `AlertTriangle` ainda é usado na seção de exclusão de conta (linha ≈513). `AlertCircle` e `CheckCircle2` eram usados apenas dentro do bloco `{alert && <Alert>}`.

- [ ] **Passo 3: Remover o `alert` state (≈linhas 63–67)**

  Localizar e remover:
  ```tsx
  const [alert, setAlert] = useState<{ 
    title: string
    description: string
    variant: 'default' | 'destructive'
  } | null>(null)
  ```

- [ ] **Passo 4: Substituir `setAlert` em `fetchProfile` (≈linhas 95–99)**

  **Erro de fetch (≈linhas 95–99):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Não foi possível carregar o perfil',
    variant: 'destructive',
  })
  ```
  Substituir por:
  ```tsx
  showError('Erro', 'Não foi possível carregar o perfil')
  ```

- [ ] **Passo 5: Substituir `setAlert` em `handleSave` (≈linhas 120–213)**

  **5a — `setAlert(null)` no início (linha 120):** Remover completamente (não tem equivalente em toast).

  **5b — Senhas não coincidem (≈linhas 124–128):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'As senhas não coincidem',
    variant: 'destructive',
  })
  return
  ```
  Substituir por:
  ```tsx
  showError('Erro', 'As senhas não coincidem')
  return
  ```

  **5c — Senha muito curta (≈linhas 133–137):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'A nova senha deve ter no mínimo 6 caracteres',
    variant: 'destructive',
  })
  return
  ```
  Substituir por:
  ```tsx
  showError('Erro', 'A nova senha deve ter no mínimo 6 caracteres')
  return
  ```

  **5d — Senha atual não informada (≈linhas 147–151):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: 'Informe sua senha atual para alterar a senha',
    variant: 'destructive',
  })
  return
  ```
  Substituir por:
  ```tsx
  showError('Erro', 'Informe sua senha atual para alterar a senha')
  return
  ```

  **5e — Sucesso (≈linhas 191–195):**
  ```tsx
  setAlert({
    title: 'Sucesso',
    description: 'Perfil atualizado com sucesso!',
    variant: 'default',
  })
  ```
  Substituir por:
  ```tsx
  showSuccess('Perfil atualizado com sucesso!')
  ```

  **5f — Erro catch (≈linhas 209–213):**
  ```tsx
  setAlert({
    title: 'Erro',
    description: error.message || 'Erro ao salvar perfil',
    variant: 'destructive',
  })
  ```
  Substituir por:
  ```tsx
  showError('Erro ao salvar perfil', error.message || 'Tente novamente.')
  ```

- [ ] **Passo 6: Substituir `setAlert` em `handleDeleteAccount` (≈linhas 220–253)**

  **6a — `setAlert(null)` no início (linha 223):** Remover completamente.

  **6b — Erro catch (≈linhas 249–253):**
  ```tsx
  setAlert({
    title: 'Erro ao excluir conta',
    description: error.message || 'Não foi possível excluir sua conta. Verifique se não há pedidos em andamento.',
    variant: 'destructive',
  })
  ```
  Substituir por:
  ```tsx
  showError('Erro ao excluir conta', error.message || 'Não foi possível excluir sua conta. Verifique se não há pedidos em andamento.')
  ```

- [ ] **Passo 7: Remover o bloco JSX do Alert (≈linhas 287–300)**

  Localizar e remover:
  ```tsx
  {alert && (
    <Alert 
      variant={alert.variant} 
      className="mb-6"
    >
      {alert.variant === 'destructive' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      <AlertTitle>{alert.title}</AlertTitle>
      <AlertDescription>{alert.description}</AlertDescription>
    </Alert>
  )}
  ```

- [ ] **Passo 8: Commit**

  ```bash
  git add src/app/profile/page.tsx
  git commit -m "fix: substituir alert state por toasts em profile"
  ```

---

## Task 5: `src/app/dashboard/page.tsx`

**Arquivo:** `src/app/dashboard/page.tsx` — remoção de estado morto apenas. O `alert` state existe mas nunca é populado via `setAlert` nesta página.

- [ ] **Passo 1: Remover o `alert` state (≈linhas 53–57)**

  Localizar e remover:
  ```tsx
  const [alert, setAlert] = useState<{ 
    title: string
    description: string
    variant: 'default' | 'destructive'
  } | null>(null)
  ```

- [ ] **Passo 2: Remover o bloco JSX do Alert (≈linhas 232–245)**

  Localizar e remover:
  ```tsx
  {alert && (
    <Alert 
      variant={alert.variant} 
      className="mb-6"
    >
      {alert.variant === 'destructive' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Package className="h-4 w-4" />
      )}
      <AlertTitle>{alert.title}</AlertTitle>
      <AlertDescription>{alert.description}</AlertDescription>
    </Alert>
  )}
  ```

- [ ] **Passo 3: Remover imports de Alert (linha 39)**

  Localizar e remover:
  ```tsx
  import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
  ```

- [ ] **Passo 4: Verificar imports de `AlertCircle`**

  Verificar se `AlertCircle` de `lucide-react` é usado em outro lugar na página além do bloco removido. Buscar por `AlertCircle` no arquivo. Se não encontrar outro uso, remover do import de `lucide-react`.

  Import atual de lucide-react está na linha ≈22. Verificar se inclui `AlertCircle` e removê-lo se não mais usado.

- [ ] **Passo 5: Commit**

  ```bash
  git add src/app/dashboard/page.tsx
  git commit -m "fix: remover estado morto de alert no dashboard do cliente"
  ```

---

## Checklist de conclusão

- [ ] `booster/page.tsx`: zero `setAlert`, zero `alert` state, imports Alert removidos
- [ ] `admin/orders/page.tsx`: zero `setAlert`, zero `alert` state, imports Alert removidos, import toast adicionado
- [ ] `admin/users/page.tsx`: zero `setAlert`, zero `alert` state, imports Alert removidos, import toast adicionado
- [ ] `profile/page.tsx`: zero `setAlert`, zero `alert` state, imports Alert removidos (AlertDialog mantido), import toast adicionado
- [ ] `dashboard/page.tsx`: estado morto removido, imports Alert removidos
- [ ] `admin/commissions/page.tsx`: **não modificado** (configAlert é validação de form — correto)
- [ ] Páginas de auth: **não modificadas**
- [ ] `admin/page.tsx`: **não modificado** (Alert para erro de fetch — correto)
