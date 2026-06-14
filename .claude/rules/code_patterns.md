# Code Patterns — FlautasBoost

Conventions for API routes and frontend data flow. These are enforced across the codebase; follow them in new code and don't regress existing code. (Styling lives in `design_system.md`; this file is about logic/structure.)

---

## API Routes (`src/app/api/**`)

### 1. Error responses: `message`, never `error`

The frontend reads `data.message`. The `error` **key is forbidden** in any JSON response.

```ts
// ✅
return Response.json({ message: 'Pedido não encontrado' }, { status: HttpStatus.NOT_FOUND })
// ❌
return NextResponse.json({ error: 'Not found' }, { status: 404 })
```

Need a **machine-readable code** alongside the human message? Use the `code` key (the client parses `data.code` / `ApiError.code`, e.g. `auth-context.tsx`, `cart/page.tsx`):

```ts
return NextResponse.json(
  { message: 'Muitas tentativas. Aguarde.', code: ErrorCodes.RATE_LIMIT_EXCEEDED },
  { status: HttpStatus.TOO_MANY_REQUESTS }
)
```

Extra debug detail (dev-only routes) → use a `detail` key, never `error`.

### 2. HTTP status: use `HttpStatus`, not raw numbers

```ts
import { HttpStatus } from '@/lib/http-status'
return Response.json({ message: '...' }, { status: HttpStatus.BAD_REQUEST }) // not 400
```

### 3. Auth: `verifyAuth` / `verifyAdmin`

```ts
import { verifyAuth, verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

const authResult = await verifyAuth(request)
if (!authResult.authenticated) return createAuthErrorResponseFromResult(authResult)
```

Never hand-roll `getServerSession` / token parsing in a route.

### 4. Input validation: `validateBody` + Zod schemas

```ts
import { validateBody, createValidationErrorResponse } from '@/lib/validate'
import { CreatePixSchema } from '@/schemas'

const validation = validateBody(CreatePixSchema, body)
if (!validation.success) return createValidationErrorResponse(validation.error)
```

### 5. `withApiHandler` is the default wrapper

New routes should use `withApiHandler` (centralizes error handling/logging). It lazy-imports `api-errors` to keep Prisma out of the static graph.

**Caveat (do not break tests):** `api-errors.ts` has a **transitive Prisma import**. Adding `createApiErrorResponse` (or `withApiHandler`) to a route whose Jest tests currently pass without Prisma will break those tests. For those routes, keep an **inline `catch` returning `{ message: '...' }`** instead. When in doubt, run that route's test after changing it.

---

## Frontend (`src/app/**`, `src/components/**`)

### 6. Never call `fetch` directly — use the `api` client (`@/lib/api-client`)

All client-side requests to our own `/api/**` routes go through the **`api`** object from
`@/lib/api-client`: **`api.get` / `api.post` / `api.put` / `api.patch` / `api.delete`**. It
centralizes the `Authorization` header, JSON `Content-Type` (auto-skipped for `FormData`
uploads), automatic 401 handling (token clear + redirect), and it **parses the JSON and throws
`ApiError`** on a non-2xx response — so call sites just `try/await/catch`. Raw `fetch('/api/...')`
in `src/app/**`, `src/components/**`, `src/hooks/**`, or `src/contexts/**` is **forbidden**.

```ts
import { api, ApiError } from '@/lib/api-client'

// GET — returns the parsed body, throws on error
const data = await api.get<{ orders: Order[] }>('/api/orders')

// Mutations — pass the body object (no JSON.stringify, no headers)
try {
  await api.put(`/api/admin/users/${id}`, { active: true })
  showSuccess('Usuário ativado!')
} catch (e) {
  showError('Erro', e instanceof ApiError ? e.message : 'Tente novamente.')
}

// FormData upload — pass the FormData; the client keeps the multipart boundary
const { url } = await api.post<{ url: string }>('/api/upload/completion-proof', formData)

// Public / auth-flow calls where a 401 is expected → skip the auth redirect
await api.post('/api/auth/login', { email, password }, { requireAuth: false })
```

```ts
// ❌ never
const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
if (res.ok) { const data = await res.json() }
```

> Signatures: `api.get(url, options?)`, `api.delete(url, options?)`,
> `api.post|put|patch(url, body?, options?)`. `options` extends `RequestInit` plus
> `requireAuth?: boolean` (so `cache`, `signal`, etc. work too). The generic types the parsed
> response (`api.get<T>`).

**Exceptions** (not our JSON `/api` request/response cycle): `EventSource`/SSE streams
(`/api/realtime`), and server-side code (route handlers, `src/services/**`, `src/lib/*` server
utils) calling **external** providers (AbacatePay, Asaas, Resend, Leetify) — those keep `fetch`.

### 7. Auth/post-action redirects: `router.replace()`, not `push()`

Redirecting away from a protected page, or after login/verify/reset/payment success, must use `replace()` so the user can't navigate **back** into a stale/protected state.

```ts
router.replace('/login')      // ✅
router.push('/login')         // ❌ for redirects
```

### 8. Page-level loading: `useLoading`, not manual `useState`

```ts
import { useLoading } from '@/hooks/use-loading'
const { loading, withLoading } = useLoading({ initialLoading: true })

const fetchData = () => withLoading(async () => { /* ... */ })
```

Don't manage page loading with `const [loading, setLoading] = useState(true)`.

### 9. Read `data.message` from API responses, never `data.error`

Mirrors rule 1. For codes, read `data.code` (or `ApiError.code`).

### 10. No sub-components defined inside a component body

Defining `const Foo = () => <.../>` inside another component remounts it every render. Hoist it to module scope, or use a JSX variable (`const foo = <.../>`).

---

## Imports

### 11. Prisma

- **Runtime client** (the `PrismaClient` instance / queries): always `import { db } from '@/lib/db'` — never instantiate or import the client from `@/generated/prisma`.
- **Type-only imports** of enums and `Prisma` namespace types (`OrderStatus`, `Role`, `PaymentStatus`, `Prisma.XxxWhereInput`) **from `@/generated/prisma/client` are acceptable** — they're erased at build time and don't pull the runtime client into the route. This is intentional and widespread; do **not** mass-refactor these.

---

## Related

- Styling/brand rules → `design_system.md`
- Component usage (shadcn) → `components.md`
- Git workflow → the `git-flow` skill (`.claude/skills/git-flow/`)
- Architecture, gotchas, env vars → root `CLAUDE.md`
