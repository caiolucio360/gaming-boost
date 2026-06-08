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

## Plano de remediação (PRs)

| PR | Tema | Severidade alvo | Status |
|----|------|-----------------|--------|
| #58 | Higiene de segredos (.env) | 🟢 (preventivo) | ✅ Merged |
| PR 2 | Security headers + next.config | 🟠/🟡 | ⏳ |
| PR 3 | Assinatura webhooks + logging | 🔴/🟠 | ⏳ |
| PR 4 | AuthZ / IDOR / mass assignment | 🟡 | ⏳ |
| PR 5 | AuthN hardening | 🟡 | ⏳ |
| PR 6 | Upload & arquivos | 🟡 | ⏳ |
| PR 7 | Dados / Postgres | 🟡 | ⏳ |
| PR 8 | Dependências | 🟠 | ⏳ |

> Este documento é atualizado conforme cada PR é mergeado (coluna Status + status por achado).
