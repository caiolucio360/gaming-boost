# Hardening de PostgreSQL — FlautasBoost

> Guia de aplicação **manual** (infra, fora do código). O app conecta via Prisma 7 +
> `@prisma/adapter-pg` (`pg.Pool`) sobre uma única `DATABASE_URL` (banco gerenciado).
> Arquitetura **single-tenant**: uma plataforma, muitos usuários — a isolação por
> usuário é feita a nível de aplicação (ownership checks já auditados em `docs/security-audit.md`).
> Por isso a RLS aqui é **defesa em profundidade opcional**, não o controle primário.

Referência completa de comandos: skill `postgres-hardening` (`.claude/skills/postgres-hardening`).

---

## Contexto do projeto (o que muda vs. o guia genérico)

| Aspecto | Situação aqui | Implicação |
|---------|---------------|------------|
| Hospedagem do banco | Gerenciado (Neon/Supabase/Vercel Postgres/RDS) | Rede, `pg_hba.conf`, binding e versão são do provedor — **não** editáveis por nós |
| Conexão | `pg.Pool` em `src/lib/db.ts` via `DATABASE_URL` | TLS e role são definidos na connection string |
| Migrações | `prisma db push` / `prisma generate` (mesma `DATABASE_URL`) | Hoje runtime e DDL usam **a mesma role** → ponto a separar |
| Multi-tenancy | Não (single-tenant) | RLS por tenant não se aplica; RLS por usuário é opcional |
| Runtime | Serverless (Vercel) | Pooling precisa de atenção (ver §3) |

Como o banco é gerenciado, **rede / `pg_hba` / binding / backups base / upgrades** são responsabilidade
do provedor — confira o painel dele. As ações abaixo são as que **dependem de nós**.

---

## 1. Separação de roles (prioridade alta) 🔴

Hoje o app provavelmente usa **uma única role** (a do provedor, frequentemente com poder de DDL/owner)
tanto para o runtime quanto para `prisma db push`. Uma SQL-injection no runtime herdaria poder de
alterar o schema. Separe:

```sql
-- Role de runtime: SÓ dados, sem DDL, sem superuser.
CREATE ROLE app_user LOGIN PASSWORD :'pw_app';
GRANT CONNECT ON DATABASE app_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- Role de migração: dona do schema, usada só por deploy/CI (prisma db push / migrate).
CREATE ROLE app_owner LOGIN PASSWORD :'pw_owner';
GRANT CONNECT, CREATE ON DATABASE app_db TO app_owner;
-- app_owner deve ser a dona das tabelas (rode as migrações com ela).
```

Mapear no app:

- **`DATABASE_URL`** (usada por `src/lib/db.ts` no runtime) → `app_user`.
- **`DIRECT_DATABASE_URL`** (nova var, usada só por `prisma db push`/migrate em deploy/CI) → `app_owner`.
  Configure em `prisma.config.ts` / scripts de migração para apontar `db push` à `DIRECT_DATABASE_URL`.

> Em provedores gerenciados que não dão superuser, crie as duas roles a partir da role-admin do painel
> e garanta que `app_owner` seja a **owner** das tabelas (senão `app_user` não recebe os grants por default privileges).

Auditar quem tem poder demais:

```sql
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls
FROM pg_roles WHERE rolcanlogin ORDER BY rolname;
```

A role do runtime **não** pode ter `rolsuper`, `rolcreatedb`, `rolcreaterole` nem `rolbypassrls`.

---

## 2. TLS na connection string (prioridade alta) 🔴

A causa de erro mais comum é `sslmode=require`, que **criptografa mas não valida o certificado**
(vulnerável a MITM). Use `verify-full` em produção:

```
# .env (produção) — runtime
DATABASE_URL="postgresql://app_user:***@host:5432/app_db?sslmode=verify-full&sslrootcert=/path/ca.pem"
```

- `sslmode=verify-full` valida cadeia **e** hostname.
- Provedores gerenciados publicam o CA root — baixe e referencie em `sslrootcert`.
- Se o provedor só suportar `require`, documente o motivo aqui.

> Atenção: o `pg.Pool` em `src/lib/db.ts` lê apenas a `connectionString`. Os parâmetros de SSL
> precisam estar **na URL** (acima) — não há config de SSL separada no código hoje.

---

## 3. Pooling em serverless (prioridade média) 🟠

`new Pool({ connectionString })` por instância serverless pode esgotar as conexões do Postgres sob
carga (cada cold start abre um pool).

- Use o **pooler do provedor** (PgBouncer / Neon pooler / Supabase pooler / Prisma Accelerate) na
  `DATABASE_URL` de runtime, e a conexão **direta** só na `DIRECT_DATABASE_URL` de migração.
- Limite o pool por instância (ex.: `new Pool({ connectionString, max: 1..5 })`) — em serverless,
  pools grandes por instância multiplicam conexões. Ajuste conforme o limite do plano.

---

## 4. RLS — defesa em profundidade opcional (prioridade baixa) 🟢

O app é single-tenant e já valida ownership por usuário no código. RLS aqui **não substitui** isso,
mas adiciona uma rede de segurança no banco para tabelas com dados por-usuário (ex.: `Order`,
`BoosterCommission`, `BankAccount`). Só adote se quiser o controle no banco — exige passar o
usuário corrente por conexão, o que **conflita com pooling** se não houver disciplina de `SET LOCAL`.

```sql
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" FORCE ROW LEVEL SECURITY;
CREATE POLICY order_owner ON "Order"
  USING ("userId" = current_setting('app.current_user_id')::int)
  WITH CHECK ("userId" = current_setting('app.current_user_id')::int);
-- Por request, antes das queries: SET LOCAL app.current_user_id = '<id>';
```

⚠️ Com `pg.Pool` reutilizando conexões entre requests, **só use `SET LOCAL` dentro de transação**
(`prisma.$transaction`) — senão o contexto vaza entre usuários. Pelo custo/risco, mantenha como
backlog e só faça se houver requisito de compliance. Hoje **não recomendado** dado o ownership de app.

---

## 5. Backups (prioridade média) 🟠

Em banco gerenciado, backups/PITR costumam vir habilitados — mas **valide**:

- Confirme no painel: backups automáticos + janela de retenção + PITR ativos.
- **Teste um restore** num banco descartável pelo menos 1x/trimestre — backup não testado é desejo, não backup.
- Se exportar dumps para fora do provedor, **criptografe antes** de sair do host
  (`pg_dump -Fc | gzip | age -r <pubkey>`), e não os guarde junto do banco.

---

## 6. Logging / auditoria (prioridade média) 🟠

No painel do provedor (ou `postgresql.conf` se self-hosted), garanta:

```
log_connections = on
log_disconnections = on
log_min_duration_statement = 500ms   -- slow queries
log_statement = 'ddl'                -- toda DDL
```

- Encaminhe logs **para fora do host** (um comprometimento não pode apagar a própria trilha).
- Configure alerta em `authentication failed` (tentativa de brute force na role do banco).
- `pg_audit` (`pgaudit.log = 'write, ddl'`) se precisar de detalhe por statement.

---

## 7. Rotação de segredos (prioridade média) 🟠

- Senhas de `app_user` / `app_owner` rotacionadas periodicamente e **independentes**.
- A `DATABASE_URL` vive só em variáveis de ambiente (Vercel) — nunca commitada
  (já garantido: `.env` é template, `.env.local` no `.gitignore`, ver `docs/security-audit.md`).
- Ao rotacionar: atualize a env var no Vercel **antes** de revogar a senha antiga.

---

## Checklist de aplicação

- [ ] `app_user` (runtime, sem DDL/superuser) e `app_owner` (migração) criadas
- [ ] `DATABASE_URL` → `app_user`; `DIRECT_DATABASE_URL` → `app_owner`; `prisma db push` aponta para a direta
- [ ] `sslmode=verify-full` + `sslrootcert` na `DATABASE_URL` de produção
- [ ] Pooler do provedor na URL de runtime; pool `max` limitado no `pg.Pool`
- [ ] Backups/PITR confirmados no painel + 1 restore de teste feito
- [ ] Logging (connections, slow query, DDL) ativo e encaminhado para fora do host
- [ ] Auditoria de roles: nenhuma role de login com `rolsuper`/`rolbypassrls` indevido
- [ ] RLS: avaliada e decidida (hoje **opcional/não recomendada** — ownership é a nível de app)

---

> Itens de rede, `pg_hba.conf`, binding e upgrade de major version são geridos pelo provedor
> gerenciado — revise o painel dele. Para self-hosted, ver a skill `postgres-hardening` (passos 1, 2, 8).
