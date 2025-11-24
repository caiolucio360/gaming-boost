# Árvore de Rotas - GameBoost

Este documento descreve todas as rotas da aplicação, incluindo rotas públicas, protegidas e APIs.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Rotas Públicas (Frontend)](#rotas-públicas-frontend)
3. [Rotas Protegidas](#rotas-protegidas)
4. [Rotas de API](#rotas-de-api)
5. [Rotas Especiais](#rotas-especiais)
6. [Legenda](#legenda)

---

## Visão Geral

A aplicação utiliza o **Next.js App Router** com as seguintes categorias de rotas:

- **Rotas Públicas**: Acessíveis sem autenticação
- **Rotas Protegidas**: Requerem autenticação (algumas com restrição de role)
- **Rotas de API**: Endpoints REST para comunicação frontend/backend
- **Rotas Especiais**: Sitemap, robots.txt, etc.

---

## Rotas Públicas (Frontend)

Rotas acessíveis sem necessidade de autenticação.

### 🏠 Páginas Principais

```
/
├── /                    → Página inicial (Home)
├── /about               → Sobre a plataforma
├── /testimonials        → Depoimentos de clientes
├── /contact             → Formulário de contato
├── /privacy             → Política de privacidade
└── /terms               → Termos de uso
```

### 🎮 Páginas de Jogos

```
/games
├── /games/cs2           → Página do Counter-Strike 2
│   └── /games/cs2/pricing → Calculadora de preços CS2
├── /games/lol           → Página do League of Legends (futuro)
└── /games/valorant      → Página do Valorant (futuro)
```

### 🛒 E-commerce

```
/cart                    → Carrinho de compras (público, mas com funcionalidades limitadas)
```

### 🔐 Autenticação

```
/(auth)
├── /login               → Página de login
└── /register            → Página de registro
```

**Nota**: O grupo `(auth)` é um route group do Next.js e não aparece na URL.

---

## Rotas Protegidas

Rotas que requerem autenticação. Algumas têm restrições específicas por role.

### 👤 Cliente (CLIENT)

```
/dashboard               → Dashboard do cliente
│                        → Lista de pedidos do usuário
│                        → Ações: pagar, cancelar pedidos
│
/profile                 → Perfil do usuário
│                        → Editar informações pessoais
│                        → Alterar senha
│
/payment                 → Página de pagamento
│                        → Query params: ?orderId={id}
│                        → Gera código PIX para pagamento
```

**Proteção**: 
- Requer autenticação
- Redireciona ADMIN → `/admin`
- Redireciona BOOSTER → `/booster`
- Apenas CLIENT permanece na rota

### ⚡ Booster (BOOSTER)

```
/booster                 → Dashboard do booster
│                        → Pedidos disponíveis
│                        → Pedidos em andamento
│                        → Pedidos concluídos
│                        → Estatísticas de trabalho
```

**Proteção**: 
- Requer autenticação
- Apenas role BOOSTER ou ADMIN
- Redireciona CLIENT → `/dashboard`
- Redireciona ADMIN → `/admin`

### 👨‍💼 Administrador (ADMIN)

```
/admin                   → Dashboard administrativo
│                        → Estatísticas gerais
│                        → Pedidos recentes
│                        → Links rápidos
│
/admin/orders            → Gerenciamento de pedidos
│                        → Listar todos os pedidos
│                        → Filtrar por status
│                        → Atualizar status de pedidos
│
/admin/users             → Gerenciamento de usuários
│                        → Listar todos os usuários
│                        → Filtrar por role
│                        → Buscar por email/nome
│                        → Editar/Deletar usuários
│
/admin/services          → Gerenciamento de serviços
│                        → Listar serviços
│                        → Criar/Editar/Deletar serviços
```

**Proteção**: 
- Requer autenticação
- Apenas role ADMIN
- Redireciona CLIENT → `/dashboard`
- Redireciona BOOSTER → `/booster`

---

## Rotas de API

Endpoints REST para comunicação entre frontend e backend.

### 🔐 Autenticação (`/api/auth`)

```
POST   /api/auth/login      → Login do usuário
│                            → Body: { email, password }
│                            → Response: { token, user, redirectPath }
│
POST   /api/auth/register   → Registro de novo usuário
│                            → Body: { name, email, password }
│                            → Response: { token, user }
│
GET    /api/auth/me         → Obter dados do usuário autenticado
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { user }
│
POST   /api/auth/logout     → Logout (limpa token no frontend)
│                            → Headers: Authorization: Bearer {token}
```

**Proteção**: 
- `/login` e `/register`: Públicos
- `/me` e `/logout`: Requerem autenticação

### 📦 Pedidos (`/api/orders`)

```
GET    /api/orders          → Listar pedidos do usuário autenticado
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { orders: Order[] }
│
POST   /api/orders          → Criar novo pedido
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { serviceId, currentRank, targetRank, ... }
│                            → Response: { order }
│
GET    /api/orders/[id]     → Obter detalhes de um pedido
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { order }
│
PUT    /api/orders/[id]     → Atualizar pedido (cancelar)
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { status: 'CANCELLED' }
│                            → Response: { order }
```

**Proteção**: 
- Todas as rotas requerem autenticação
- Apenas o dono do pedido pode acessar seus pedidos

### 🎮 Serviços (`/api/services`)

```
GET    /api/services        → Listar serviços disponíveis
│                            → Response: { services: Service[] }
│                            → Público (não requer autenticação)
```

### 👤 Perfil do Usuário (`/api/user`)

```
GET    /api/user/profile    → Obter perfil do usuário
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { user }
│
PUT    /api/user/profile    → Atualizar perfil do usuário
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { name, phone, currentPassword, newPassword }
│                            → Response: { user }
```

**Proteção**: 
- Requer autenticação
- Apenas o próprio usuário pode acessar/editar seu perfil

### ⚡ Booster (`/api/booster`)

```
GET    /api/booster/orders  → Listar pedidos para booster
│                            → Query params: ?type=available|assigned|completed
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { orders: Order[], stats: Stats }
│
POST   /api/booster/orders/[id] → Aceitar pedido
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { action: 'accept' }
│                            → Response: { order }
│
PUT    /api/booster/orders/[id] → Atualizar status do pedido
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { status: 'COMPLETED' }
│                            → Response: { order }
```

**Proteção**: 
- Requer autenticação
- Apenas role BOOSTER ou ADMIN

### 👨‍💼 Administrador (`/api/admin`)

#### Estatísticas

```
GET    /api/admin/stats     → Obter estatísticas gerais
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { stats: { users, orders, services, revenue, recentOrders } }
```

#### Usuários

```
GET    /api/admin/users     → Listar todos os usuários
│                            → Query params: ?role=CLIENT|BOOSTER|ADMIN&search={term}
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { users: User[] }
│
GET    /api/admin/users/[id] → Obter detalhes de um usuário
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { user }
│
PUT    /api/admin/users/[id] → Atualizar usuário
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { name, role, active, ... }
│                            → Response: { user }
│
DELETE /api/admin/users/[id] → Deletar usuário
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { message }
```

#### Pedidos

```
GET    /api/admin/orders    → Listar todos os pedidos
│                            → Query params: ?status=PENDING|IN_PROGRESS|...
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { orders: Order[] }
│
GET    /api/admin/orders/[id] → Obter detalhes de um pedido
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { order }
│
PUT    /api/admin/orders/[id] → Atualizar pedido (status, booster, etc)
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { status, boosterId, ... }
│                            → Response: { order }
```

#### Serviços

```
GET    /api/admin/services  → Listar todos os serviços
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { services: Service[] }
│
POST   /api/admin/services  → Criar novo serviço
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { game, type, name, description, price, ... }
│                            → Response: { service }
│
GET    /api/admin/services/[id] → Obter detalhes de um serviço
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { service }
│
PUT    /api/admin/services/[id] → Atualizar serviço
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { name, description, price, enabled, ... }
│                            → Response: { service }
│
DELETE /api/admin/services/[id] → Deletar serviço
│                            → Headers: Authorization: Bearer {token}
│                            → Response: { message }
```

**Proteção**: 
- Todas as rotas requerem autenticação
- Apenas role ADMIN

### 💳 Pagamento (`/api/payment`)

```
POST   /api/payment/pix     → Gerar código PIX para pagamento
│                            → Headers: Authorization: Bearer {token}
│                            → Body: { orderId, total }
│                            → Response: { pixCode, qrCode, expiresAt }
```

**Proteção**: 
- Requer autenticação
- Apenas o dono do pedido pode gerar pagamento

---

## Rotas Especiais

Rotas especiais do Next.js para SEO e configuração.

```
/robots.txt               → Arquivo robots.txt (gerado dinamicamente)
│                          → Arquivo: src/app/robots.ts
│
/sitemap.xml              → Sitemap XML (gerado dinamicamente)
│                          → Arquivo: src/app/sitemap.ts
│
/favicon.ico              → Ícone do site
│                          → Arquivo: src/app/favicon.ico
```

---

## Árvore Completa de Rotas

```
/
├── /                          [PÚBLICO] Home
├── /about                     [PÚBLICO] Sobre
├── /testimonials              [PÚBLICO] Depoimentos
├── /contact                   [PÚBLICO] Contato
├── /privacy                   [PÚBLICO] Privacidade
├── /terms                     [PÚBLICO] Termos
│
├── /games
│   ├── /games/cs2             [PÚBLICO] CS2
│   │   └── /games/cs2/pricing [PÚBLICO] Calculadora CS2
│   ├── /games/lol             [PÚBLICO] League of Legends
│   └── /games/valorant        [PÚBLICO] Valorant
│
├── /cart                      [PÚBLICO] Carrinho
│
├── /(auth)
│   ├── /login                 [PÚBLICO] Login
│   └── /register              [PÚBLICO] Registro
│
├── /dashboard                 [CLIENT] Dashboard Cliente
├── /profile                   [AUTH] Perfil
├── /payment                   [AUTH] Pagamento
│
├── /booster                   [BOOSTER] Dashboard Booster
│
├── /admin                     [ADMIN] Dashboard Admin
│   ├── /admin/orders          [ADMIN] Gerenciar Pedidos
│   ├── /admin/users           [ADMIN] Gerenciar Usuários
│   └── /admin/services        [ADMIN] Gerenciar Serviços
│
└── /api
    ├── /api/auth
    │   ├── POST /api/auth/login
    │   ├── POST /api/auth/register
    │   ├── GET  /api/auth/me
    │   └── POST /api/auth/logout
    │
    ├── /api/orders
    │   ├── GET  /api/orders
    │   ├── POST /api/orders
    │   ├── GET  /api/orders/[id]
    │   └── PUT  /api/orders/[id]
    │
    ├── /api/services
    │   └── GET  /api/services
    │
    ├── /api/user
    │   └── /api/user/profile
    │       ├── GET /api/user/profile
    │       └── PUT /api/user/profile
    │
    ├── /api/booster
    │   └── /api/booster/orders
    │       ├── GET  /api/booster/orders
    │       ├── POST /api/booster/orders/[id]
    │       └── PUT  /api/booster/orders/[id]
    │
    ├── /api/admin
    │   ├── GET  /api/admin/stats
    │   │
    │   ├── /api/admin/users
    │   │   ├── GET    /api/admin/users
    │   │   ├── GET    /api/admin/users/[id]
    │   │   ├── PUT    /api/admin/users/[id]
    │   │   └── DELETE /api/admin/users/[id]
    │   │
    │   ├── /api/admin/orders
    │   │   ├── GET /api/admin/orders
    │   │   ├── GET /api/admin/orders/[id]
    │   │   └── PUT /api/admin/orders/[id]
    │   │
    │   └── /api/admin/services
    │       ├── GET    /api/admin/services
    │       ├── POST   /api/admin/services
    │       ├── GET    /api/admin/services/[id]
    │       ├── PUT    /api/admin/services/[id]
    │       └── DELETE /api/admin/services/[id]
    │
    └── /api/payment
        └── POST /api/payment/pix
```

---

## Legenda

### Níveis de Acesso

| Símbolo | Descrição |
|---------|-----------|
| `[PÚBLICO]` | Rota acessível sem autenticação |
| `[AUTH]` | Rota que requer autenticação (qualquer role) |
| `[CLIENT]` | Rota exclusiva para clientes |
| `[BOOSTER]` | Rota exclusiva para boosters |
| `[ADMIN]` | Rota exclusiva para administradores |

### Métodos HTTP

| Método | Descrição |
|--------|-----------|
| `GET` | Obter dados |
| `POST` | Criar novo recurso |
| `PUT` | Atualizar recurso existente |
| `DELETE` | Deletar recurso |

### Parâmetros de Rota

| Sintaxe | Descrição |
|---------|-----------|
| `[id]` | Parâmetro dinâmico (ex: `/api/orders/abc123`) |
| `?param=value` | Query parameter (ex: `?status=PENDING`) |

---

## Redirecionamentos Automáticos

A aplicação possui redirecionamentos automáticos baseados no role do usuário:

### Após Login
- **CLIENT** → `/dashboard`
- **BOOSTER** → `/booster`
- **ADMIN** → `/admin`

### Acesso a Rotas Protegidas
- **CLIENT** acessando `/booster` ou `/admin` → Redireciona para `/dashboard`
- **BOOSTER** acessando `/dashboard` ou `/admin` → Redireciona para `/booster`
- **ADMIN** acessando `/dashboard` ou `/booster` → Redireciona para `/admin`
- **Não autenticado** acessando qualquer rota protegida → Redireciona para `/login`

---

## Observações Importantes

### Autenticação
- Todas as rotas de API protegidas requerem o header `Authorization: Bearer {token}`
- Tokens são armazenados no `localStorage` com a chave `auth_token`
- Tokens expiram após 7 dias (configurável via `JWT_EXPIRES_IN`)

### Validações
- Rotas de API validam autenticação via middleware (`auth-middleware.ts`)
- Rotas de frontend validam autenticação via `useAuth()` hook
- Validações de role são feitas tanto no frontend quanto no backend

### Segurança
- Senhas são hasheadas com bcrypt antes de serem armazenadas
- Tokens JWT são assinados com secret key
- Rotas de API validam tokens antes de processar requisições
- CORS é configurado para permitir apenas requisições da mesma origem

---

## Estrutura de Arquivos

As rotas seguem a estrutura do Next.js App Router:

```
src/app/
├── page.tsx                    → / (Home)
├── about/page.tsx              → /about
├── (auth)/
│   ├── login/page.tsx          → /login
│   └── register/page.tsx       → /register
├── dashboard/page.tsx          → /dashboard
├── admin/
│   ├── page.tsx                → /admin
│   ├── orders/page.tsx         → /admin/orders
│   └── users/page.tsx          → /admin/users
└── api/
    ├── auth/
    │   └── login/route.ts      → POST /api/auth/login
    └── orders/
        └── route.ts            → GET/POST /api/orders
```

---

**Última atualização**: 2024  
**Versão do Next.js**: 15.4.6

