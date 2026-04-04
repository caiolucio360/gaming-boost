# GameBoost

Plataforma web full-stack para serviços de boost em jogos eletrônicos. Conecta jogadores que precisam de boost com boosters profissionais de forma segura e eficiente, com pagamentos via PIX.

## Funcionalidades

### Para Clientes
- **Carrinho de Compras** — Adicione e configure serviços antes de contratar
- **Pagamento PIX** — Integração com AbacatePay para pagamentos instantâneos
- **Acompanhamento de Pedidos** — Acompanhe o status dos seus boosts em tempo real
- **Cancelamento e Reembolso** — Cancele pedidos pendentes/pagos com reembolso automático
- **Prova de Conclusão** — Visualize a screenshot de conclusão enviada pelo booster
- **Notificações** — Receba atualizações sobre seus pedidos
- **Verificação de Email** — Código de 6 dígitos para ativação da conta

### Para Boosters
- **Candidatura** — Formulário de aplicação para se tornar booster
- **Painel de Pedidos** — Aceite e gerencie seus pedidos
- **Prova de Conclusão** — Upload de screenshot obrigatório ao concluir pedido
- **Comissões e Saques** — Acompanhe ganhos e solicite saques via PIX
- **Perfil Técnico** — Bio, stats de CS2 e status de verificação

### Para Administradores
- **Gestão de Usuários** — Gerencie clientes, boosters e admins com comissões customizadas
- **Gestão de Pedidos** — Acompanhe todos os pedidos com visualização de provas de conclusão
- **Gestão de Pagamentos** — Receitas, saques e aprovações
- **Comissões** — Configure percentuais globais (booster / admin / dev-admin) e por booster
- **Precificação Dinâmica** — Configure faixas de preço por modo de jogo via painel admin
- **Aprovação de Boosters** — Revise e aprove candidaturas

### Roles do Sistema
- **CLIENT** — Compra serviços de boost
- **BOOSTER** — Executa os boosts e recebe comissões
- **ADMIN** — Gerencia a plataforma e recebe parte do lucro
- **Dev-Admin** — Admin especial com percentual off-the-top antes da divisão regular

## Jogos Suportados

- **Counter-Strike 2 (CS2)**
  - Boost de Rank Premier (1K–26K pontos)
  - Boost Gamers Club (Níveis 1–20)
  - Precificação progressiva por faixa de rating, configurável pelo admin

## Stack Tecnológica

### Frontend
- **Next.js 15** — App Router, Server Components, Turbopack
- **React 19** — Hooks modernos
- **TypeScript** — Strict mode em todo o projeto
- **Tailwind CSS v4** — Utility-first com brand palette customizada
- **shadcn/ui** — Componentes acessíveis baseados em Radix UI
- **React Hook Form + Zod** — Validação de formulários type-safe
- **Framer Motion** — Animações
- **Sonner** — Toast notifications

### Backend
- **Next.js API Routes** — Endpoints RESTful
- **Prisma 7.x** — ORM type-safe com PostgreSQL (Neon)
- **NextAuth.js** — Autenticação com JWT (7 dias)
- **bcryptjs** — Hash de senhas
- **jsonwebtoken** — JWT customizado para APIs
- **AbacatePay SDK** — PIX (pagamento e saque)
- **Resend** — Emails transacionais
- **@vercel/blob** — Upload de imagens (provas de conclusão)

### Infraestrutura
- **Vercel** — Deploy com Cron Jobs (auto-refund diário às 6h UTC)
- **Neon** — PostgreSQL serverless
- **Jest + Testing Library** — 105+ testes (API, componentes, schemas, segurança)
- **ESLint** — Linting com configuração Next.js

## Arquitetura

### Padrões Principais
- **Service Layer** — Lógica de negócio em `src/services/`, rotas API como controllers finos
- **Result Pattern** — `Success<T> | Failure` em vez de exceptions nas services
- **Zod Schemas** — Validação centralizada em `src/schemas/`
- **Rate Limiting** — In-memory por endpoint (auth: 5/15min, PIX: 5/min, etc.)
- **AES-256-GCM** — Criptografia para credenciais Steam
- **Idempotência** — Webhooks com guard `status=PENDING` para evitar processamento duplo

### Sistema de Comissões
Fluxo de divisão de lucro:
1. **Dev-Admin** recebe percentual off-the-top (ex: 10%)
2. Do valor restante: **Booster** recebe seu percentual (ex: 25%)
3. **Admin** recebe o restante automaticamente (100% - percentual do booster)

Percentuais configuráveis via `/admin/commissions`. Snapshot no momento da criação do pedido.

### Estrutura de Pastas
```
src/
├── app/
│   ├── (auth)/            # Login, registro, verificação, reset de senha
│   ├── (dashboard)/       # Notificações
│   ├── admin/             # Painel admin (orders, users, boosters, pricing, payments, commissions)
│   ├── booster/           # Dashboard do booster (orders, payments, apply)
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticação e verificação
│   │   ├── orders/        # CRUD + cancelamento + credenciais Steam
│   │   ├── payment/       # PIX (geração, status, simulação dev)
│   │   ├── pricing/       # Cálculo dinâmico de preços
│   │   ├── upload/        # Upload de provas de conclusão
│   │   ├── webhooks/      # AbacatePay
│   │   ├── admin/         # Endpoints administrativos
│   │   ├── booster/       # Endpoints do booster
│   │   ├── user/          # Perfil e conta
│   │   ├── notifications/ # Notificações
│   │   └── cron/          # Auto-refund agendado
│   └── [páginas públicas]
├── components/
│   ├── ui/                # shadcn/ui base
│   ├── common/            # Componentes reutilizáveis
│   ├── layout/            # Header, footer, nav mobile
│   └── games/             # Calculadoras por jogo
├── contexts/              # Auth, Cart
├── hooks/                 # useLoading, useRealtime, useOrders, useUser, usePayment
├── lib/                   # db, auth, jwt, encryption, abacatepay, email, pricing, rate-limit
├── schemas/               # Zod schemas (auth, order, payment, steam)
├── services/              # Lógica de negócio (auth, order, payment, steam, user, verification)
└── __tests__/             # Testes organizados por domínio
```

## Fluxos Principais

### Pagamento PIX
1. Cliente cria pedido → gera QR Code PIX via AbacatePay
2. Webhook confirma pagamento → cria registros de comissão/receita
3. Booster disponível aceita → pedido entra em progresso
4. Booster conclui com screenshot → cliente visualiza prova
5. Admin aprova pagamentos pendentes

### Auto-Refund
- Pedidos `PAID` sem booster após X horas → reembolso automático
- Cron diário às 6h UTC (`/api/cron/auto-refund`)
- Configurável via `ORDER_TIMEOUT_HOURS`

### Cancelamento pelo Cliente
- Permitido para pedidos `PENDING` e `PAID`
- PAID: reembolso automático via AbacatePay antes de cancelar
- IN_PROGRESS e COMPLETED: contatar suporte

## Scripts

```bash
# Desenvolvimento
npm run dev              # Servidor com Turbopack
npm run build            # Build de produção
npm start                # Servidor de produção

# Banco de dados
npm run db:generate      # Gerar Prisma Client
npm run db:push          # Aplicar mudanças no schema
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Popular com dados iniciais

# Qualidade
npm run lint             # ESLint
npm run lint:fix         # Auto-fix
npm test                 # Todos os testes
npm run test:coverage    # Relatório de cobertura
```

## Como Começar

### Pré-requisitos
- Node.js 20+
- PostgreSQL (recomendado: Neon)

### Instalação

```bash
git clone <repository-url>
cd gaming-boost
npm install
```

### Variáveis de Ambiente

```env
# Obrigatórias
DATABASE_URL=             # PostgreSQL connection string
NEXTAUTH_SECRET=          # Secret para JWT de sessão
NEXT_PUBLIC_API_URL=      # URL pública da API
JWT_SECRET=               # Secret para JWT customizado
ENCRYPTION_KEY=           # 64 hex chars (AES-256 para credenciais Steam)

# Pagamentos e Emails
ABACATEPAY_API_KEY=       # Chave AbacatePay
ABACATEPAY_WEBHOOK_SECRET= # Secret do webhook (obrigatório)
RESEND_API_KEY=           # Chave Resend para emails
EMAIL_FROM=               # Email remetente

# Uploads
BLOB_READ_WRITE_TOKEN=    # Vercel Blob (provas de conclusão)

# Configuração
ORDER_TIMEOUT_HOURS=24    # Horas para auto-refund (padrão: 24)
CRON_SECRET=              # Secret para endpoints cron
NEXT_PUBLIC_SITE_URL=     # URL pública para SEO
```

### Iniciar

```bash
npm run db:push
npm run db:seed
npm run dev
# Acesse http://localhost:3000
```

## Licença

Projeto privado e proprietário.

---

**Status:** Em desenvolvimento ativo  
**Última atualização:** Abril 2026
