# Design: Padronização de Feedback em Todas as Páginas

**Data:** 2026-04-09  
**Status:** Aprovado

---

## Contexto

O sistema usa dois mecanismos de feedback ao usuário:

1. **Sonner toasts** (`showError`, `showSuccess`) — correto para feedback de ações
2. **`alert` state + `setAlert` + `setTimeout`** — padrão incorreto usado em várias páginas, onde um `Alert` inline aparece no topo da página por 5s e some. Problemas:
   - Alert fica longe do contexto da ação (especialmente quando a ação ocorre em um Dialog)
   - `setTimeout` manual é frágil e inconsistente
   - Mistura dois sistemas de feedback no mesmo projeto

---

## Regra

| Situação | Mecanismo correto |
|----------|------------------|
| Resultado de uma ação do usuário (aceitar, salvar, concluir) | `showSuccess` / `showError` toast |
| Erro de carregamento de dados (fetch inicial) | `Alert` inline persistente |
| Validação de formulário inline (antes do submit) | `Alert` inline persistente |
| Validação de campo específico | `FormMessage` (react-hook-form) |

---

## Arquivos a modificar

### 1. `src/app/booster/page.tsx`

**Remover:**
- `const [alert, setAlert] = useState<...>(null)` (linha 99)
- Bloco JSX `{alert && <Alert>...</Alert>}` (linhas 391–396)
- Imports `Alert`, `AlertDescription`, `AlertTitle` de `@/components/ui/alert`

**Substituições:**

| Ação | Antes | Depois |
|------|-------|--------|
| Aceitar pedido — sucesso | `setAlert({ title: 'Sucesso', description: 'Pedido aceito com sucesso!', variant: 'default' })` + `setTimeout` | `showSuccess('Pedido aceito com sucesso!')` |
| Aceitar pedido — erro API | `setAlert({ title: 'Erro', description: data.message \|\| '...', variant: 'destructive' })` + `setTimeout` | `showError('Erro ao aceitar pedido', data.message \|\| 'Tente novamente.')` |
| Aceitar pedido — erro catch | `setAlert({ title: 'Erro', description: 'Erro ao aceitar pedido', variant: 'destructive' })` + `setTimeout` | `showError('Erro ao aceitar pedido')` |
| Upload prova — erro | `setAlert({ title: 'Erro no upload', description: uploadData.message \|\| '...', variant: 'destructive' })` + `setTimeout` | `showError('Erro no upload', uploadData.message \|\| 'Tente novamente.')` |
| Concluir pedido — sucesso | `setAlert({ title: 'Sucesso', description: 'Pedido marcado como concluído!', variant: 'default' })` + `setTimeout` | `showSuccess('Pedido marcado como concluído!')` |
| Concluir pedido — erro API | `setAlert({ title: 'Erro', description: data.message \|\| '...', variant: 'destructive' })` + `setTimeout` | `showError('Erro ao concluir pedido', data.message \|\| 'Tente novamente.')` |
| Concluir pedido — erro catch | `setAlert({ title: 'Erro', description: 'Erro ao concluir pedido', variant: 'destructive' })` + `setTimeout` | `showError('Erro ao concluir pedido')` |

---

### 2. `src/app/admin/users/page.tsx`

**Remover:**
- `const [alert, setAlert] = useState<...>(null)`
- Bloco JSX `{alert && <Alert>...</Alert>}`
- Imports `Alert`, `AlertDescription`, `AlertTitle`

**Substituições:** todos os `setAlert({ variant: 'default', ... })` → `showSuccess(description)`, todos `setAlert({ variant: 'destructive', ... })` → `showError(title, description)`.

**Adicionar import:** `import { showSuccess, showError } from '@/lib/toast'`

---

### 3. `src/app/admin/orders/page.tsx`

**Remover:**
- `const [alert, setAlert] = useState<...>(null)`
- Bloco JSX `{alert && <Alert>...</Alert>}`
- Imports `Alert`, `AlertTitle`, `AlertDescription`

**Substituições:** mesmo padrão — `default` → `showSuccess`, `destructive` → `showError`.

**Adicionar import:** `import { showSuccess, showError } from '@/lib/toast'`

---

### 4. `src/app/profile/page.tsx`

**Remover:**
- `const [alert, setAlert] = useState<...>(null)`
- Bloco JSX `{alert && <Alert>...</Alert>}` no topo do formulário
- Import `Alert`, `AlertDescription`, `AlertTitle` (manter `AlertDialog`, `AlertDialogTrigger`, etc. — são componentes diferentes usados para confirmação de deleção de conta)

**Substituições:** mesmo padrão.

---

### 5. `src/app/dashboard/page.tsx`

**`alert` state nunca é populado via `setAlert`** — é estado morto.

**Remover apenas:**
- `const [alert, setAlert] = useState<...>(null)`
- Bloco JSX `{alert && <Alert>...</Alert>}` (linhas 232–245)
- Imports `Alert`, `AlertDescription`, `AlertTitle`, `AlertCircle` (verificar se `AlertCircle` é usado em outro lugar na página antes de remover)

Nenhuma substituição de lógica necessária.

---

## Fora do escopo

- `src/app/admin/commissions/page.tsx` — `configAlert` é validação de formulário inline (correto, mantém)
- Páginas de auth (`/login`, `/register`, etc.) — `Alert` inline para erros de formulário (correto, mantém)
- `src/app/admin/page.tsx` — `Alert` para erro de fetch inicial (correto, mantém)

---

## Critérios de conclusão

- [ ] `booster/page.tsx`: zero `setAlert`, zero `alert` state, zero `Alert` imports desnecessários
- [ ] `admin/users/page.tsx`: mesmo
- [ ] `admin/orders/page.tsx`: mesmo
- [ ] `profile/page.tsx`: mesmo (manter `AlertDialog` imports)
- [ ] `dashboard/page.tsx`: estado morto removido
- [ ] Nenhuma regressão nos casos corretos (commissions, auth, admin dashboard)
