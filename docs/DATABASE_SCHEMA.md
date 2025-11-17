# Documentação do Schema do Banco de Dados

Este documento descreve todas as entidades, relacionamentos e estruturas do banco de dados da aplicação Gaming Boost.

## Índice

1. [Visão Geral](#visão-geral)
2. [Entidades](#entidades)
   - [User](#user)
   - [Service](#service)
   - [Order](#order)
   - [Payment](#payment)
3. [Enums](#enums)
   - [Role](#role)
   - [Game](#game)
   - [ServiceType](#servicetype)
   - [OrderStatus](#orderstatus)
4. [Relacionamentos](#relacionamentos)
5. [Índices](#índices)

---

## Visão Geral

O banco de dados utiliza **PostgreSQL** como SGBD e **Prisma ORM** para gerenciamento. O schema foi projetado para suportar uma plataforma de boost de jogos, permitindo que clientes solicitem serviços de melhoria de rank/rating, boosters executem esses serviços e administradores gerenciem a plataforma.

---

## Entidades

### User

Representa os usuários da plataforma (clientes, boosters e administradores).

#### Campos

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | Int | Identificador único do usuário | Primary Key, Auto-increment |
| `email` | String | Email do usuário (usado para login) | Unique, Obrigatório |
| `name` | String? | Nome completo do usuário | Opcional |
| `password` | String | Hash da senha do usuário | Obrigatório (bcrypt) |
| `role` | Role | Papel do usuário na plataforma | Default: CLIENT |
| `phone` | String? | Telefone de contato | Opcional |
| `active` | Boolean | Indica se a conta está ativa | Default: true |
| `metadata` | String? | JSON com metadados adicionais | Opcional |
| `createdAt` | DateTime | Data de criação do registro | Auto-gerado |
| `updatedAt` | DateTime | Data da última atualização | Auto-atualizado |

#### Relacionamentos

- **orders**: Um usuário pode ter múltiplos pedidos como cliente (One-to-Many)
- **boosterOrders**: Um usuário pode ter múltiplos pedidos como booster (One-to-Many)

#### Observações

- O campo `password` deve armazenar o hash bcrypt da senha, nunca a senha em texto plano
- O campo `metadata` pode armazenar informações adicionais em formato JSON, como preferências, configurações, etc.
- Usuários com `active = false` não podem fazer login na plataforma

---

### Service

Representa os serviços de boost disponíveis na plataforma.

#### Campos

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | Int | Identificador único do serviço | Primary Key, Auto-increment |
| `game` | Game | Jogo ao qual o serviço pertence | Enum, Obrigatório |
| `type` | ServiceType | Tipo de serviço oferecido | Enum, Obrigatório |
| `name` | String | Nome do serviço | Obrigatório |
| `description` | String | Descrição detalhada do serviço | Obrigatório |
| `price` | Float | Preço do serviço em reais (BRL) | Obrigatório |
| `duration` | String | Duração estimada do serviço | Obrigatório (ex: "3-5 dias") |
| `enabled` | Boolean | Indica se o serviço está ativo | Default: true |
| `image` | String? | URL da imagem do serviço | Opcional |
| `metadata` | String? | JSON com metadados adicionais | Opcional |
| `createdAt` | DateTime | Data de criação do registro | Auto-gerado |
| `updatedAt` | DateTime | Data da última atualização | Auto-atualizado |

#### Relacionamentos

- **orders**: Um serviço pode estar associado a múltiplos pedidos (One-to-Many)

#### Observações

- Serviços com `enabled = false` não aparecem para os clientes, mas podem ser visualizados por administradores
- O campo `metadata` pode armazenar informações específicas do jogo, como requisitos, regras, etc.

---

### Order

Representa um pedido de serviço feito por um cliente.

#### Campos

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | Int | Identificador único do pedido | Primary Key, Auto-increment |
| `userId` | Int | ID do cliente que fez o pedido | Foreign Key → User.id, Cascade Delete |
| `serviceId` | Int | ID do serviço solicitado | Foreign Key → Service.id, Restrict Delete |
| `boosterId` | Int? | ID do booster atribuído ao pedido | Foreign Key → User.id, SetNull Delete, Opcional |
| `status` | OrderStatus | Status atual do pedido | Default: PENDING |
| `total` | Float | Valor total do pedido em reais (BRL) | Obrigatório |
| `currentRank` | String? | Rank/pontuação atual do cliente | Opcional (ex: "10K", "Nível 5") |
| `targetRank` | String? | Rank/pontuação desejada pelo cliente | Opcional (ex: "15K", "Nível 10") |
| `currentRating` | Int? | Pontuação atual numérica | Opcional (ex: 10000) |
| `targetRating` | Int? | Pontuação desejada numérica | Opcional (ex: 15000) |
| `gameMode` | String? | Modo do jogo (ex: "PREMIER", "GAMERS_CLUB") | Opcional |
| `gameType` | String? | Tipo do jogo com modo (ex: "CS2_PREMIER") | Opcional |
| `metadata` | String? | JSON com metadados adicionais | Opcional |
| `notes` | String? | Notas adicionais do cliente ou booster | Opcional |
| `createdAt` | DateTime | Data de criação do pedido | Auto-gerado |
| `updatedAt` | DateTime | Data da última atualização | Auto-atualizado |

#### Relacionamentos

- **user**: Cliente que fez o pedido (Many-to-One)
- **service**: Serviço solicitado (Many-to-One)
- **booster**: Booster atribuído ao pedido (Many-to-One, Opcional)
- **payments**: Pagamentos associados ao pedido (One-to-Many)

#### Índices

A entidade possui os seguintes índices para otimização de queries:

1. `@@index([userId, gameMode, status])` - Para validação de modalidade duplicada (buscar pedidos ativos por modalidade)
2. `@@index([userId, status])` - Para buscar pedidos do usuário por status
3. `@@index([boosterId, status])` - Para buscar pedidos do booster por status
4. `@@index([serviceId])` - Para joins com Service
5. `@@index([status])` - Para filtros por status (admin/booster dashboards)

#### Observações

- O campo `boosterId` só é preenchido quando um booster aceita o pedido
- Os campos `currentRank`/`targetRank` e `currentRating`/`targetRating` são complementares e podem ser usados dependendo do jogo
- O campo `gameMode` é usado para validações de duplicidade (um cliente não pode ter múltiplos pedidos ativos na mesma modalidade)
- O campo `metadata` pode armazenar informações específicas do jogo, como configurações de conta, requisitos, etc.

---

### Payment

Representa um pagamento associado a um pedido.

#### Campos

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | Int | Identificador único do pagamento | Primary Key, Auto-increment |
| `orderId` | Int | ID do pedido associado | Foreign Key → Order.id, Cascade Delete |
| `method` | String | Método de pagamento utilizado | Default: "PIX" |
| `pixCode` | String? | Código PIX para pagamento | Opcional |
| `qrCode` | String? | Base64 do QR Code PIX | Opcional |
| `status` | String | Status do pagamento | Default: "PENDING" (PENDING, PAID, EXPIRED, CANCELLED) |
| `total` | Float | Valor do pagamento em reais (BRL) | Obrigatório |
| `expiresAt` | DateTime? | Data de expiração do pagamento | Opcional |
| `paidAt` | DateTime? | Data em que o pagamento foi confirmado | Opcional |
| `createdAt` | DateTime | Data de criação do registro | Auto-gerado |
| `updatedAt` | DateTime | Data da última atualização | Auto-atualizado |

#### Relacionamentos

- **order**: Pedido associado ao pagamento (Many-to-One, Cascade Delete)

#### Observações

- Quando um pedido é deletado, todos os pagamentos associados são deletados automaticamente (Cascade Delete)
- O campo `status` pode ter os seguintes valores:
  - `PENDING`: Pagamento pendente
  - `PAID`: Pagamento confirmado
  - `EXPIRED`: Pagamento expirado
  - `CANCELLED`: Pagamento cancelado
- O campo `pixCode` contém o código PIX copia e cola
- O campo `qrCode` contém a imagem do QR Code em formato Base64

---

## Enums

### Role

Define os papéis dos usuários na plataforma.

| Valor | Descrição |
|-------|-----------|
| `CLIENT` | Cliente que solicita serviços de boost |
| `BOOSTER` | Profissional que executa os serviços de boost |
| `ADMIN` | Administrador da plataforma |

**Default**: `CLIENT`

---

### Game

Define os jogos suportados pela plataforma.

| Valor | Descrição |
|-------|-----------|
| `CS2` | Counter-Strike 2 |

**Observação**: Este enum pode ser expandido no futuro para incluir outros jogos (ex: League of Legends, Valorant, etc.)

---

### ServiceType

Define os tipos de serviços oferecidos.

| Valor | Descrição |
|-------|-----------|
| `RANK_BOOST` | Serviço de melhoria de rank/rating |

**Observação**: Este enum pode ser expandido no futuro para incluir outros tipos de serviços (ex: Coaching, Account Recovery, etc.)

---

### OrderStatus

Define os status possíveis de um pedido.

| Valor | Descrição |
|-------|-----------|
| `PENDING` | Pedido criado, aguardando pagamento ou atribuição de booster |
| `IN_PROGRESS` | Pedido em andamento, sendo executado pelo booster |
| `COMPLETED` | Pedido concluído com sucesso |
| `CANCELLED` | Pedido cancelado pelo cliente ou administrador |

**Default**: `PENDING`

**Fluxo de Status**:
```
PENDING → IN_PROGRESS → COMPLETED
   ↓
CANCELLED (pode ocorrer em qualquer momento)
```

---

## Relacionamentos

### Diagrama de Relacionamentos

```
User (Cliente)
  ├── orders (1:N) → Order
  └── boosterOrders (1:N) → Order (como Booster)

User (Booster)
  └── boosterOrders (1:N) → Order

Service
  └── orders (1:N) → Order

Order
  ├── user (N:1) → User (Cliente)
  ├── service (N:1) → Service
  ├── booster (N:1) → User (Booster, Opcional)
  └── payments (1:N) → Payment

Payment
  └── order (N:1) → Order (Cascade Delete)
```

### Descrição dos Relacionamentos

1. **User ↔ Order (Cliente)**
   - Um usuário pode fazer múltiplos pedidos
   - Um pedido pertence a um único cliente
   - Relacionamento: One-to-Many

2. **User ↔ Order (Booster)**
   - Um booster pode ter múltiplos pedidos atribuídos
   - Um pedido pode ter um booster atribuído (opcional)
   - Relacionamento: One-to-Many (opcional)

3. **Service ↔ Order**
   - Um serviço pode estar em múltiplos pedidos
   - Um pedido está associado a um único serviço
   - Relacionamento: One-to-Many

4. **Order ↔ Payment**
   - Um pedido pode ter múltiplos pagamentos (para casos de reembolso, parcelamento, etc.)
   - Um pagamento pertence a um único pedido
   - Relacionamento: One-to-Many
   - **Cascade Delete**: Quando um pedido é deletado, todos os pagamentos são deletados automaticamente

---

## Índices

Os índices foram criados para otimizar as queries mais comuns da aplicação:

### Order

1. **`[userId, gameMode, status]`**
   - **Uso**: Validação de modalidade duplicada
   - **Query otimizada**: Buscar pedidos ativos de um usuário em uma modalidade específica
   - **Exemplo**: Verificar se o cliente já tem um pedido PENDING ou IN_PROGRESS em CS2_PREMIER

2. **`[userId, status]`**
   - **Uso**: Dashboard do cliente
   - **Query otimizada**: Buscar pedidos do usuário filtrados por status
   - **Exemplo**: Listar todos os pedidos PENDING do cliente

3. **`[boosterId, status]`**
   - **Uso**: Dashboard do booster
   - **Query otimizada**: Buscar pedidos do booster filtrados por status
   - **Exemplo**: Listar todos os pedidos IN_PROGRESS do booster

4. **`[serviceId]`**
   - **Uso**: Joins com Service
   - **Query otimizada**: Buscar pedidos de um serviço específico
   - **Exemplo**: Listar todos os pedidos de um serviço

5. **`[status]`**
   - **Uso**: Dashboards administrativos e de boosters
   - **Query otimizada**: Filtrar pedidos por status
   - **Exemplo**: Listar todos os pedidos PENDING na plataforma

---

## Observações Gerais

### Segurança

- Senhas são armazenadas como hash bcrypt, nunca em texto plano
- Tokens JWT são usados para autenticação e autorização
- Relacionamentos com Foreign Keys garantem integridade referencial
- IDs são numéricos (Int) com auto-increment para melhor performance e normalização

### Performance

- Índices foram criados nas colunas mais consultadas
- Cascade Delete é usado apenas onde faz sentido (Payment → Order)
- Campos opcionais permitem flexibilidade sem comprometer a estrutura

### Extensibilidade

- Campos `metadata` (JSON) permitem adicionar informações sem alterar o schema
- Enums podem ser expandidos para incluir novos jogos e tipos de serviços
- A estrutura permite adicionar novos relacionamentos no futuro

### Validações de Negócio

- Um cliente não pode ter múltiplos pedidos ativos na mesma modalidade (validação via índice)
- Pedidos só podem ser atribuídos a boosters
- Pagamentos são vinculados a pedidos e deletados junto com o pedido

---

## Versão do Schema

- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Tipo de IDs**: Int (Auto-increment)
- **Última Atualização**: 2024

---

## Contato e Suporte

Para dúvidas sobre o schema ou sugestões de melhorias, consulte a documentação do Prisma ou entre em contato com a equipe de desenvolvimento.

