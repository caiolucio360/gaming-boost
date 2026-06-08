# Relatório de Auditoria de Segurança — FlautasBoost

> Data: 2026-06-07 · Escopo: auditoria OWASP completa (Top 10 + API Top 10) de toda a
> aplicação Next.js 15 (App Router), Prisma/Postgres, NextAuth, pagamentos PIX
> (Asaas ativo / AbacatePay), uploads (Vercel Blob), e-mail (Resend).
> Metodologia: revisão manual de código + `npm audit` + varredura de padrões.
> (`semgrep` não está instalado no ambiente; revisão manual cobriu as ~50 rotas de API.)

## Resumo executivo

| Severidade | Qtd | Itens |
|-----------|-----|-------|
| 🔴 Crítica | 1 | Webhook AbacatePay sem verificação de assinatura (fraude de pagamento) |
| 🟠 Alta | 3 | Ausência de security headers; deps com CVE (undici/uuid); logging de payload de webhook |
| 🟡 Média | 4 | `eslint.ignoreDuringBuilds`; `images.domains` legado; hardening de authN; revisão de upload |
| 🟢 Baixa/Info | — | Vários controles JÁ corretos (ver "Pontos fortes") |

## Pontos fortes já existentes (não regredir)

- **Auth middleware** (`src/lib/auth-middleware.ts`) consistente; status via `code`, nunca string-matching.
- **Ownership/IDOR** verificado nas rotas `[id]` revisadas: `orders/[id]` (`order.userId !== userId` → 403),
  `orders/[id]/chat` (delega ao `ChatService` com checagem de acesso). Padrão sólido.
- **Webhook Asaas** (provedor ATIVO) valida `asaas-access-token` vs `ASAAS_WEBHOOK_SECRET` (500 se ausente, 401 se inválido).
- **Idempotência** de pagamento: `confirmPayment` usa `updateMany` com guarda `status=PENDING` em transação.
- **Cron** (`auto-refund`, `cleanup-blob`): exigem `CRON_SECRET` via `Authorization: Bearer`.
- **Payment simulate** (`payment/pix/simulate`): retorna 403 em produção.
- **Segredos**: `.env` versionado era template (placeholders); `.env.local` nunca foi versionado;
  histórico limpo. Corrigido no PR #58 (removido do tracking + `.env.example` + `.gitignore` reforçado).

---

## Achados (mapeados a OWASP Top 10 / API Top 10)

### 🔴 A01/API1 — Webhook AbacatePay sem autenticação → fraude de pagamento
- **Arquivo:** `src/app/api/webhooks/abacatepay/route.ts`
- **Descrição:** A rota faz `JSON.parse` do corpo e chama `PaymentService.processWebhookEvent`
  **sem nenhuma verificação de assinatura/segredo** (apenas um comentário "validação opcional").
  Um atacante pode `POST {event:'billing.paid', data:{billing:{id:<providerId>, status:'PAID'}}}`
  e marcar um pedido como **PAGO sem pagamento** (e disparar `withdraw.done`/`REFUNDED`).
- **Observação:** Embora `ACTIVE_PAYMENT_PROVIDER=ASAAS`, a rota AbacatePay continua publicada e acessível.
  O `CLAUDE.md` afirma "ABACATEPAY_WEBHOOK_SECRET ausente → 500", mas o código **não** implementa isso.
- **Correção (PR 3):** validar `ABACATEPAY_WEBHOOK_SECRET` (header de assinatura do provedor; 500 se
  não configurado, 401 se inválido) — espelhar o padrão já correto do webhook Asaas. Se a integração
  AbacatePay não for mais usada, considerar remover/desabilitar a rota.

### 🟠 A05 — Ausência de cabeçalhos de segurança
- **Arquivo:** `next.config.js` (sem função `headers()`).
- **Faltam:** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Impacto:** clickjacking, MIME sniffing, ausência de HSTS, sem mitigação de XSS via CSP.
- **Correção (PR 2):** adicionar `headers()` com CSP compatível com App Router.

### 🟠 A06 — Dependências vulneráveis
- **`npm audit`:** 18 vulnerabilidades (11 high, 7 moderate).
  - `undici` (transitiva): smuggling/CRLF/DoS — **corrigível** com `npm audit fix` (não-breaking).
  - `uuid <11.1.1` via `next-auth <=4.24.14` (moderate): fix exigiria `next-auth@3` (**breaking** — não aplicar).
- **Correção (PR 8):** `npm audit fix` para undici; documentar/aceitar o risco de `uuid` (baixo impacto real,
  buffer bounds em v3/v5/v6 com `buf` fornecido — não é o uso do next-auth); acompanhar release do next-auth.

### 🟠 A09 — Logging de payload de webhook
- **Arquivo:** `src/app/api/webhooks/abacatepay/route.ts:26` — `console.log(JSON.stringify(payload))`.
- **Impacto:** dados de transação em logs.
- **Correção (PR 3):** logar apenas IDs/evento, nunca o payload completo.

### 🟡 A05 — `eslint.ignoreDuringBuilds: true`
- **Arquivo:** `next.config.js:31`. Mascara erros de lint (inclusive regras de segurança) no build.
- **Correção (PR 2):** avaliar reabilitar; se houver muitos erros legados, corrigir incrementalmente.

### 🟡 A10/SSRF — `images.domains` legado
- **Arquivo:** `next.config.js:15` — `images.domains: ['localhost']` (API deprecada).
- **Correção (PR 2):** migrar para `remotePatterns` com allowlist estrita (evita SSRF via `next/image`).

### 🟡 A07 — Hardening de autenticação (a confirmar)
- **Arquivos:** `src/app/api/auth/**`, `src/lib/rate-limit.ts`.
- **Verificar (PR 5):** política de senha (NIST 800-63B), lockout sem enumeração de usuários em
  login/forgot/reset, cobertura de rate limit em todas as rotas de auth, expiração de código de verificação.

### 🟡 API3/API6 — Mass assignment & exposição de dados (a confirmar)
- **Verificar (PR 4/PR 7):** garantir que rotas de `PUT/PATCH` usam whitelist Zod (nunca repassam `body`
  bruto ao Prisma) e que `select` explícito evita vazar campos sensíveis (hash de senha, credenciais Steam).

### 🟡 Upload de arquivos (a confirmar)
- **Arquivo:** `src/app/api/upload/completion-proof/route.ts`.
- **Verificar (PR 6):** validação de magic bytes + allowlist de tipo, re-encode de imagem (sharp),
  strip EXIF, storage key path-safe, `Content-Disposition` na entrega.

---

## Inventário de superfície de API

- **49 arquivos de rota** / 67 handlers HTTP.
- **36 rotas** usam `verifyAuth`/`verifyAdmin`/`verifyRole`/`getServerSession`.
- **~13 rotas públicas por design:** `webhooks/*` (assinatura), `cron/*` (CRON_SECRET),
  `auth/*` (login/register/forgot/reset/verify/resend/logout), `pricing/{calculate,ranges}`.
- Proteção de páginas em `src/middleware.ts` (admin/booster/dashboard) revisada — coerente.

## Plano de remediação (PRs) — STATUS FINAL

| PR | Tema | Severidade | Status |
|----|------|-----------|--------|
| #58 | Higiene de segredos (.env → .env.example) | 🟢 preventivo | ✅ Merged |
| #59 | Relatório de auditoria (Fase 1) | — | ✅ Merged |
| #60 | 🔴 Autenticar webhook AbacatePay + logging | 🔴/🟠 | ✅ Merged |
| #61 | Security headers + remotePatterns | 🟠/🟡 | ✅ Merged |
| #62 | AuthN: mínimo de senha 6→8 (NIST) | 🟡 | ✅ Merged |
| #63 | Validar domínio do completionProofUrl | 🟡 | ✅ Merged |
| #64 | Dependências (npm audit fix — undici) | 🟠 | ✅ Merged |
| PR 4 | AuthZ / IDOR / mass assignment | 🟡 | ✅ Auditado — **nenhuma falha** (sem mudança) |
| PR 7 | Exposição de dados | 🟡 | ✅ Auditado — **nenhum vazamento** (sem mudança) |

### Resultado por achado

- 🔴 Webhook AbacatePay sem auth → **CORRIGIDO** (#60).
- 🟠 Security headers ausentes → **CORRIGIDO** (#61).
- 🟠 Deps vulneráveis (undici, 11 high) → **CORRIGIDO** (#64); 18→7 vulns.
- 🟠 Logging de payload de webhook → **CORRIGIDO** (#60).
- 🟡 `images.domains` legado → **CORRIGIDO** (#61, remotePatterns).
- 🟡 AuthN (senha mínima) → **CORRIGIDO** (#62).
- 🟡 IDOR/BOLA/mass assignment → **AUDITADO, sem falhas** (ownership consistente, whitelist por destructuring).
- 🟡 Exposição de dados → **AUDITADO, sem vazamentos** (`select` explícito em toda parte; password nunca retornado).
- 🟡 Upload → **bem implementado**; endurecido o vínculo proof↔storage (#63).

## Pendências / recomendações (PRs dedicados futuros)

1. ~~**Upgrade do Next.js** (🟠 high restante)~~ → **CORRIGIDO (2026-06-08, ver abaixo).**
   15.5.9 → 15.5.19: fecha o bypass de middleware/proxy (GHSA-492v-c6pp-mqqv), cache poisoning
   em RSC e XSS de postcss. Build + 192/192 testes validados.
2. **uuid <11.1.1 via next-auth** (🟡 moderate): só corrige com next-auth@3 (downgrade/breaking).
   Acompanhar release do next-auth 4.x que atualize o uuid. Impacto real baixo.
3. **`eslint.ignoreDuringBuilds: true`** (🟡): reabilitar em PR dedicado, corrigindo erros legados
   incrementalmente (atualmente mascara regras de lint no build).
4. **CSP por nonce** (🟡): evoluir a CSP atual (que usa `unsafe-inline`) para nonce via middleware.
5. **`realtime` token via query string** (🟢 cleanup): fallback é dead code (`verifyAuth` usa
   `getServerSession`/cookie e ignora o header Bearer) — remover para evitar confusão e token em logs.
6. **Hardening de Postgres** (infra, fora do código): RLS multi-tenant, roles read-only/read-write
   separados, TLS, backups criptografados, pg_audit. Ver skill `postgres-hardening`.
7. ~~**Senha definida por admin** (`admin/users/[id]`): ainda usa mínimo 6~~ → **JÁ ESTÁ EM 8**
   (`route.ts:117`, `password.length >= 8`). Pendência obsoleta.

> Auditoria executada em 2026-06-07. PRs #58–#64 mergeados em `dev`. Verificação final: `npm test`
> 192/192 e `npm run build` exit 0 no `dev` integrado.

---

## Atualização — 2026-06-08 (re-auditoria + upgrade Next/Prisma)

**Estado do `npm audit` no início:** 1 high + 6 moderate (prod). Causa do high: Next.js 15.5.9 na
faixa do **bypass de middleware/proxy** — crítico aqui porque `src/middleware.ts` é a camada de
proteção de `/admin`, `/booster`, `/dashboard`.

**Correções aplicadas (branch `fix/next-security-upgrade`):**
- `next` **15.5.9 → 15.5.19**: fecha GHSA-492v-c6pp-mqqv (middleware bypass), cache poisoning RSC e
  XSS de postcss bundled.
- `@prisma/client` / `@prisma/adapter-pg` / `prisma` **→ 7.8.0** (estavam inconsistentes:
  package.json 7.0.1 vs instalado 7.8.0). Isso também eliminou um **valibot ReDoS (high,
  GHSA-vqpr-j7v3-hqw9)** que entrava via `prisma 7.0.1 → @prisma/dev → valibot 1.1.0`, e restaurou
  build/test consistentes (o client gerado defasado quebrava 6 testes).

**Resultado:** `npm audit` (prod) **0 high**, **7 moderate** — todos transitivos de risco aceito,
só "corrigíveis" com downgrades breaking e de impacto real desprezível:
- `uuid <11.1.1` via `next-auth` (path não usado pelo next-auth; só next-auth@3 corrige).
- `postcss` bundled dentro de `next` (build-time, processa o próprio CSS).
- `@hono/node-server` via `@prisma/dev` (**ferramenta dev-only**, fora do runtime de produção).

**Re-auditoria de auth (Fase 2):** confirmado — todas as 6 rotas `auth/*` aplicam rate-limit;
`login` retorna 401 genérico (sem enumeração); `forgot-password` com anti-enumeração + token
hasheado (sha256) + expiração 1h; `verify` com expiração de código via `VerificationService`.
Nenhuma correção necessária.

> Verificação final: `npm test` 192/192 e `npm run build` exit 0 na branch `fix/next-security-upgrade`.

### Hardening de cabeçalhos (mesma data)

- **CSP: `'unsafe-eval'` removido em produção** (`next.config.js`) — mantido apenas em dev (Turbopack).
  Reduz a superfície de XSS no runtime de produção. `script-src`/`style-src` ainda usam
  `'unsafe-inline'` (nonce completo segue como item futuro, ver abaixo).
- **`Cross-Origin-Opener-Policy: same-origin-allow-popups`** adicionado — isola o contexto de
  navegação (mitiga XS-Leaks/Spectre) preservando fluxos de popup/redirect de pagamento.

### Pendências ainda abertas (PRs dedicados, fora do escopo de segurança imediata)

- **CSP por nonce** (🟡): exige reescrever o `withAuth` middleware, expandir o matcher para todas as
  rotas e resolver `style-src` com nonce (inviável direto com Tailwind v4 + framer-motion inline) —
  requer QA de browser. Não é um simples ajuste de config.
- **Reabilitar `eslint.ignoreDuringBuilds`** (🟡 qualidade, não-segurança): ~96 erros + 89 warnings
  (`no-explicit-any`, `no-unused-vars`, `react-hooks/exhaustive-deps`), nenhum é regra de segurança.
  Chore dedicado e incremental.
- **Hardening de Postgres** (infra, fora do código): RLS multi-tenant, roles read-only/read-write,
  TLS, backups criptografados, pg_audit. Ver skill `postgres-hardening`.
