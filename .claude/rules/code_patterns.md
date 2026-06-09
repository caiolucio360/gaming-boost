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

### 6. Auth/post-action redirects: `router.replace()`, not `push()`

Redirecting away from a protected page, or after login/verify/reset/payment success, must use `replace()` so the user can't navigate **back** into a stale/protected state.

```ts
router.replace('/login')      // ✅
router.push('/login')         // ❌ for redirects
```

### 7. Page-level loading: `useLoading`, not manual `useState`

```ts
import { useLoading } from '@/hooks/use-loading'
const { loading, withLoading } = useLoading({ initialLoading: true })

const fetchData = () => withLoading(async () => { /* ... */ })
```

Don't manage page loading with `const [loading, setLoading] = useState(true)`.

### 8. Read `data.message` from API responses, never `data.error`

Mirrors rule 1. For codes, read `data.code` (or `ApiError.code`).

### 9. No sub-components defined inside a component body

Defining `const Foo = () => <.../>` inside another component remounts it every render. Hoist it to module scope, or use a JSX variable (`const foo = <.../>`).

---

## Imports

### 10. Prisma

- **Runtime client** (the `PrismaClient` instance / queries): always `import { db } from '@/lib/db'` — never instantiate or import the client from `@/generated/prisma`.
- **Type-only imports** of enums and `Prisma` namespace types (`OrderStatus`, `Role`, `PaymentStatus`, `Prisma.XxxWhereInput`) **from `@/generated/prisma/client` are acceptable** — they're erased at build time and don't pull the runtime client into the route. This is intentional and widespread; do **not** mass-refactor these.

---

## Related

- Styling/brand rules → `design_system.md`
- Component usage (shadcn) → `components.md`
- Git workflow → `git-flow.md`
- Architecture, gotchas, env vars → root `CLAUDE.md`
