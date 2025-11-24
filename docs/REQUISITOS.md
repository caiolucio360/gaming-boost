# Documento de Requisitos - GameBoost

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Objetivos e Escopo](#objetivos-e-escopo)
3. [Perfis de Usuário](#perfis-de-usuário)
4. [Funcionalidades por Perfil](#funcionalidades-por-perfil)
5. [Regras de Negócio](#regras-de-negócio)
6. [Fluxos Principais](#fluxos-principais)
7. [Modelo de Dados](#modelo-de-dados)
8. [Requisitos Técnicos](#requisitos-técnicos)
9. [Requisitos Não-Funcionais](#requisitos-não-funcionais)
10. [Segurança](#segurança)
11. [Integrações](#integrações)

---

## Visão Geral

### 1.1 Descrição do Projeto

**GameBoost** é uma plataforma web completa para serviços de boost profissional em jogos eletrônicos, inicialmente focada em **Counter-Strike 2 (CS2)**. A plataforma conecta clientes que desejam melhorar seus ranks/ratings com boosters profissionais verificados que executam os serviços.

### 1.2 Problema que Resolve

- Clientes precisam de uma forma segura e confiável de contratar serviços de boost
- Boosters precisam de uma plataforma para gerenciar seus serviços e receber pagamentos
- Administradores precisam de ferramentas para gerenciar a plataforma, usuários e serviços

### 1.3 Público-Alvo

- **Clientes**: Jogadores de CS2 que desejam melhorar seu rank Premier ou nível no Gamers Club
- **Boosters**: Profissionais que oferecem serviços de boost
- **Administradores**: Equipe responsável pela gestão da plataforma

---

## Objetivos e Escopo

### 2.1 Objetivos

1. Fornecer uma plataforma segura e confiável para contratação de serviços de boost
2. Facilitar o gerenciamento de pedidos para clientes, boosters e administradores
3. Implementar sistema de pagamento seguro via PIX
4. Garantir transparência no processo de comissões e receitas
5. Oferecer experiência de usuário moderna e responsiva

### 2.2 Escopo do Projeto

#### 2.2.1 Incluído

- Sistema de autenticação e autorização (JWT)
- Gerenciamento de usuários (Clientes, Boosters, Administradores)
- Calculadora de preços dinâmica para CS2 (Premier e Gamers Club)
- Sistema de carrinho de compras
- Criação e gerenciamento de pedidos
- Sistema de pagamento via PIX
- Dashboard para cada perfil de usuário
- Sistema de comissões e receitas
- Gerenciamento de serviços
- Histórico de comissões personalizadas por booster

#### 2.2.2 Não Incluído (Futuro)

- Integração com gateways de pagamento automáticos (webhooks)
- Sistema de saque para boosters e administradores
- Suporte a outros jogos (LoL, Valorant) - estrutura preparada
- Sistema de avaliações e reviews
- Chat em tempo real entre cliente e booster
- Notificações push
- App mobile

---

## Perfis de Usuário

### 3.1 Cliente (CLIENT)

**Descrição**: Usuário que contrata serviços de boost.

**Características**:
- Pode navegar pelo site sem autenticação
- Precisa se registrar para criar pedidos
- Pode ter múltiplos pedidos, mas apenas 1 ativo por modalidade
- Acessa dashboard pessoal para acompanhar pedidos

### 3.2 Booster (BOOSTER)

**Descrição**: Profissional que executa serviços de boost.

**Características**:
- Visualiza pedidos disponíveis
- Aceita pedidos para executar
- Atualiza status dos pedidos
- Recebe comissão personalizada (configurável por admin)
- Acessa dashboard com estatísticas de trabalho

### 3.3 Administrador (ADMIN)

**Descrição**: Responsável pela gestão da plataforma.

**Características**:
- Acesso total ao sistema
- Gerencia usuários, serviços e pedidos
- Configura porcentagens de comissão global
- Define comissões personalizadas por booster
- Visualiza estatísticas gerais da plataforma
- Recebe receita dos pedidos

---

## Funcionalidades por Perfil

### 4.1 Funcionalidades Públicas (Sem Autenticação)

#### 4.1.1 Navegação
- **RF-001**: Usuário pode navegar pela página inicial
- **RF-002**: Usuário pode visualizar informações sobre a plataforma
- **RF-003**: Usuário pode acessar páginas de jogos disponíveis
- **RF-004**: Usuário pode usar calculadora de preços
- **RF-005**: Usuário pode adicionar itens ao carrinho (funcionalidade limitada)

#### 4.1.2 Autenticação
- **RF-006**: Usuário pode se registrar com email, nome e senha
- **RF-007**: Usuário pode fazer login com email e senha
- **RF-008**: Sistema deve validar credenciais e retornar token JWT
- **RF-009**: Sistema deve redirecionar usuário baseado no role após login

### 4.2 Funcionalidades do Cliente

#### 4.2.1 Dashboard
- **RF-010**: Cliente pode visualizar todos os seus pedidos
- **RF-011**: Cliente pode filtrar pedidos por status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- **RF-012**: Cliente pode filtrar pedidos por jogo
- **RF-013**: Cliente pode ordenar pedidos por data (mais recente/mais antigo)
- **RF-014**: Cliente pode visualizar detalhes de cada pedido

#### 4.2.2 Criação de Pedidos
- **RF-015**: Cliente pode criar pedido a partir do carrinho
- **RF-016**: Cliente deve informar rank/rating atual e desejado
- **RF-017**: Cliente deve selecionar modo do jogo (PREMIER ou GAMERS_CLUB)
- **RF-018**: Sistema deve validar que cliente não tem pedido ativo na mesma modalidade
- **RF-019**: Sistema deve calcular preço automaticamente baseado na calculadora
- **RF-020**: Cliente pode adicionar notas ao pedido

#### 4.2.3 Pagamento
- **RF-021**: Cliente pode gerar código PIX para pagamento
- **RF-022**: Sistema deve gerar QR Code PIX
- **RF-023**: Cliente pode visualizar código PIX e QR Code
- **RF-024**: Sistema deve definir data de expiração do pagamento
- **RF-025**: Admin pode confirmar pagamento manualmente

#### 4.2.4 Gerenciamento de Pedidos
- **RF-026**: Cliente pode cancelar pedido com status PENDING
- **RF-027**: Cliente pode visualizar histórico completo de pedidos

#### 4.2.5 Perfil
- **RF-028**: Cliente pode visualizar seus dados pessoais
- **RF-029**: Cliente pode editar nome e telefone
- **RF-030**: Cliente pode alterar senha

### 4.3 Funcionalidades do Booster

#### 4.3.1 Dashboard
- **RF-031**: Booster pode visualizar pedidos disponíveis
- **RF-032**: Booster pode visualizar pedidos atribuídos a ele
- **RF-033**: Booster pode visualizar pedidos concluídos
- **RF-034**: Booster pode visualizar estatísticas (total de pedidos, comissões, etc.)

#### 4.3.2 Gerenciamento de Pedidos
- **RF-035**: Booster pode aceitar pedido disponível
- **RF-036**: Sistema deve criar comissão quando booster aceita pedido
- **RF-037**: Booster pode atualizar status do pedido para COMPLETED
- **RF-038**: Sistema deve liberar comissão automaticamente quando pedido é concluído
- **RF-039**: Booster pode adicionar notas ao pedido

#### 4.3.3 Comissões
- **RF-040**: Booster pode visualizar comissões pendentes
- **RF-041**: Booster pode visualizar comissões pagas
- **RF-042**: Booster pode visualizar total disponível para saque
- **RF-043**: Booster pode visualizar histórico de mudanças de comissão

### 4.4 Funcionalidades do Administrador

#### 4.4.1 Dashboard
- **RF-044**: Admin pode visualizar estatísticas gerais (usuários, pedidos, receitas)
- **RF-045**: Admin pode visualizar pedidos recentes
- **RF-046**: Admin pode acessar links rápidos para gerenciamento

#### 4.4.2 Gerenciamento de Usuários
- **RF-047**: Admin pode listar todos os usuários
- **RF-048**: Admin pode filtrar usuários por role (CLIENT, BOOSTER, ADMIN)
- **RF-049**: Admin pode buscar usuários por email ou nome
- **RF-050**: Admin pode visualizar detalhes de um usuário
- **RF-051**: Admin pode editar dados de usuário
- **RF-052**: Admin pode alterar role de usuário
- **RF-053**: Admin pode ativar/desativar conta de usuário
- **RF-054**: Admin pode deletar usuário
- **RF-055**: Admin pode definir comissão personalizada para booster
- **RF-056**: Admin pode visualizar histórico de mudanças de comissão de um booster

#### 4.4.3 Gerenciamento de Pedidos
- **RF-057**: Admin pode listar todos os pedidos
- **RF-058**: Admin pode filtrar pedidos por status
- **RF-059**: Admin pode visualizar detalhes de um pedido
- **RF-060**: Admin pode atualizar status de pedido
- **RF-061**: Admin pode atribuir booster a um pedido
- **RF-062**: Admin pode marcar pedido como concluído

#### 4.4.4 Gerenciamento de Serviços
- **RF-063**: Admin pode listar todos os serviços
- **RF-064**: Admin pode criar novo serviço
- **RF-065**: Admin pode editar serviço existente
- **RF-066**: Admin pode ativar/desativar serviço
- **RF-067**: Admin pode deletar serviço

#### 4.4.5 Configurações de Comissão
- **RF-068**: Admin pode visualizar configuração de comissão ativa
- **RF-069**: Admin pode atualizar porcentagens de comissão (booster e admin)
- **RF-070**: Sistema deve validar que soma das porcentagens seja 100%
- **RF-071**: Sistema deve desabilitar configurações antigas ao criar nova

#### 4.4.6 Pagamentos
- **RF-072**: Admin pode visualizar todos os pagamentos
- **RF-073**: Admin pode confirmar pagamento PIX manualmente
- **RF-074**: Admin pode visualizar receitas pendentes e pagas

---

## Regras de Negócio

### 5.1 Autenticação e Autorização

#### RN-001: Autenticação JWT
- Tokens JWT são gerados no login e registro
- Tokens expiram após 7 dias (configurável)
- Tokens são armazenados no localStorage do cliente
- Todas as rotas protegidas validam token via middleware

#### RN-002: Redirecionamento por Role
- Após login, usuário é redirecionado baseado no role:
  - CLIENT → `/dashboard`
  - BOOSTER → `/booster`
  - ADMIN → `/admin`
- Usuário não autenticado tentando acessar rota protegida → `/login`

#### RN-003: Proteção de Rotas
- Rotas de cliente: apenas CLIENT pode acessar
- Rotas de booster: BOOSTER ou ADMIN podem acessar
- Rotas de admin: apenas ADMIN pode acessar

### 5.2 Pedidos

#### RN-004: Limite de Pedidos por Modalidade
- Cliente não pode ter mais de 1 pedido ativo (PENDING ou IN_PROGRESS) na mesma modalidade
- Modalidades: PREMIER e GAMERS_CLUB são independentes
- Cliente pode criar novo pedido apenas quando anterior estiver COMPLETED ou CANCELLED

#### RN-005: Criação de Pedido
- Pedido é criado com status PENDING
- Admin é atribuído automaticamente ao pedido (recebe receita)
- Receita do admin é calculada e criada no momento da criação do pedido
- Comissão do booster só é criada quando booster aceita o pedido

#### RN-006: Status do Pedido
- Fluxo de status: PENDING → IN_PROGRESS → COMPLETED
- Pedido pode ser CANCELLED em qualquer momento
- Apenas booster atribuído ou admin pode atualizar status para IN_PROGRESS ou COMPLETED
- Cliente pode cancelar apenas pedidos PENDING

### 5.3 Pagamentos

#### RN-007: Geração de PIX
- Código PIX é gerado quando cliente acessa página de pagamento
- QR Code é gerado em Base64
- Pagamento expira após período definido (configurável)
- Status inicial: PENDING

#### RN-008: Confirmação de Pagamento
- Admin confirma pagamento manualmente (futuro: webhook automático)
- Status muda de PENDING para PAID
- Pagamento pode expirar (status: EXPIRED) ou ser cancelado (status: CANCELLED)

#### RN-009: Liberação de Comissões
- Comissão do booster é liberada automaticamente quando pedido é marcado como COMPLETED
- Receita do admin é liberada automaticamente quando pedido é marcado como COMPLETED
- Não é necessário verificar se pagamento foi confirmado (processo automático)

### 5.4 Comissões e Receitas

#### RN-010: Configuração Global de Comissão
- Sistema possui configuração global de comissão (padrão: 70% booster, 30% admin)
- Apenas uma configuração pode estar ativa por vez
- Ao criar nova configuração, anteriores são desabilitadas
- Soma das porcentagens deve ser 100%

#### RN-011: Comissão Personalizada por Booster
- Admin pode definir comissão personalizada para cada booster
- Se booster não tem comissão personalizada, usa configuração global
- Histórico de mudanças é registrado (quem mudou, quando, motivo)

#### RN-012: Cálculo de Comissões
- Comissão do booster = total do pedido × porcentagem do booster
- Receita do admin = total do pedido × porcentagem do admin
- Valores são calculados e armazenados no pedido

### 5.5 Serviços

#### RN-013: Serviços Ativos
- Apenas serviços com `enabled = true` aparecem para clientes
- Admin pode ver todos os serviços (ativos e inativos)
- Serviço não pode ser deletado se tiver pedidos associados (Restrict Delete)

### 5.6 Preços

#### RN-014: Cálculo de Preços - Premier
- Preço é calculado por faixas progressivas de rating:
  - 1K-4.999: R$ 25/1000 pontos
  - 5K-9.999: R$ 35/1000 pontos
  - 10K-14.999: R$ 45/1000 pontos
  - 15K-19.999: R$ 50/1000 pontos
  - 20K-24.999: R$ 60/1000 pontos
  - 25K-26K: R$ 90/1000 pontos
- Cálculo é feito progressivamente, respeitando faixas

#### RN-015: Cálculo de Preços - Gamers Club
- Preço é calculado por nível:
  - Level 1-10: R$ 20/nível
  - Level 11-14: R$ 40/nível
  - Level 15-17: R$ 50/nível
  - Level 18-19: R$ 70/nível
  - Level 20: R$ 120/nível
- Cálculo é feito somando preço de cada nível do current até target

---

## Fluxos Principais

### 6.1 Fluxo de Compra (Cliente)

```
1. Cliente navega pelo site (sem login)
2. Cliente acessa calculadora de preços
3. Cliente seleciona modo (PREMIER ou GAMERS_CLUB)
4. Cliente informa rating/rank atual e desejado
5. Sistema calcula preço automaticamente
6. Cliente adiciona ao carrinho
7. Se não estiver logado, sistema redireciona para login
8. Cliente faz checkout do carrinho
9. Sistema cria pedido (status: PENDING)
10. Sistema atribui admin automaticamente
11. Sistema cria receita do admin (status: PENDING)
12. Cliente é redirecionado para página de pagamento
13. Sistema gera código PIX
14. Cliente paga via PIX
15. Admin confirma pagamento (status: PAID)
16. Booster aceita pedido (status: IN_PROGRESS)
17. Sistema cria comissão do booster (status: PENDING)
18. Booster executa serviço
19. Booster marca como concluído (status: COMPLETED)
20. Sistema libera automaticamente comissão e receita (status: PAID)
```

### 6.2 Fluxo de Aceitação (Booster)

```
1. Booster acessa dashboard
2. Booster visualiza pedidos disponíveis
3. Booster seleciona pedido para aceitar
4. Sistema valida que pedido está PENDING
5. Sistema atribui booster ao pedido
6. Sistema atualiza status para IN_PROGRESS
7. Sistema cria comissão do booster:
   - Usa comissão personalizada se existir
   - Caso contrário, usa configuração global
8. Sistema calcula valor da comissão
9. Booster executa serviço
10. Booster marca como concluído
11. Sistema atualiza status para COMPLETED
12. Sistema libera automaticamente comissão (status: PAID)
13. Sistema libera automaticamente receita do admin (status: PAID)
```

### 6.3 Fluxo de Gerenciamento (Admin)

```
1. Admin acessa dashboard
2. Admin visualiza estatísticas gerais
3. Admin pode gerenciar usuários:
   - Listar, filtrar, buscar
   - Editar, deletar
   - Definir comissão personalizada para boosters
4. Admin pode gerenciar pedidos:
   - Listar, filtrar por status
   - Atualizar status
   - Atribuir booster
   - Marcar como concluído
5. Admin pode gerenciar serviços:
   - Criar, editar, deletar
   - Ativar/desativar
6. Admin pode configurar comissões:
   - Visualizar configuração ativa
   - Atualizar porcentagens
   - Sistema valida soma = 100%
7. Admin pode confirmar pagamentos:
   - Visualizar pagamentos pendentes
   - Confirmar pagamento PIX
```

---

## Modelo de Dados

### 7.1 Entidades Principais

#### User (Usuário)
- **Campos**: id, email, name, password, role, phone, active, pixKey, boosterCommissionPercentage, metadata
- **Relacionamentos**: orders, boosterOrders, adminOrders, boosterCommissions, adminRevenues
- **Roles**: CLIENT, BOOSTER, ADMIN

#### Service (Serviço)
- **Campos**: id, game, type, name, description, price, duration, enabled, image, metadata
- **Relacionamentos**: orders
- **Games**: CS2 (futuro: LOL, VALORANT)
- **Types**: RANK_BOOST (futuro: PLACEMENT, COACHING, etc.)

#### Order (Pedido)
- **Campos**: id, userId, serviceId, boosterId, adminId, status, total, boosterCommission, adminRevenue, boosterPercentage, adminPercentage, currentRank, targetRank, currentRating, targetRating, gameMode, gameType, metadata, notes
- **Relacionamentos**: user, service, booster, admin, payments, commission, revenue
- **Status**: PENDING, IN_PROGRESS, COMPLETED, CANCELLED

#### Payment (Pagamento)
- **Campos**: id, orderId, method, pixCode, qrCode, status, total, expiresAt, paidAt
- **Relacionamentos**: order
- **Status**: PENDING, PAID, EXPIRED, CANCELLED

#### BoosterCommission (Comissão do Booster)
- **Campos**: id, orderId, boosterId, orderTotal, percentage, amount, status, paidAt
- **Relacionamentos**: order, booster
- **Status**: PENDING, PAID, CANCELLED

#### AdminRevenue (Receita do Admin)
- **Campos**: id, orderId, adminId, orderTotal, percentage, amount, status, paidAt
- **Relacionamentos**: order, admin
- **Status**: PENDING, PAID, CANCELLED

#### CommissionConfig (Configuração de Comissão)
- **Campos**: id, boosterPercentage, adminPercentage, enabled
- **Regra**: Apenas uma configuração pode estar ativa

#### BoosterCommissionHistory (Histórico de Comissão)
- **Campos**: id, boosterId, previousPercentage, newPercentage, changedBy, reason, createdAt
- **Relacionamentos**: booster, changedByUser

### 7.2 Índices

- `Order`: [userId, gameMode, status], [userId, status], [boosterId, status], [adminId, status], [serviceId], [status]
- `BoosterCommission`: [boosterId, status], [status]
- `AdminRevenue`: [adminId, status], [status]
- `BoosterCommissionHistory`: [boosterId], [changedBy], [createdAt]

---

## Requisitos Técnicos

### 8.1 Stack Tecnológica

#### Frontend
- **Framework**: Next.js 15.4.6 (App Router)
- **Biblioteca UI**: React 19
- **Linguagem**: TypeScript 5.9.2
- **Estilização**: Tailwind CSS 4.0
- **Componentes**: shadcn/ui (Radix UI)
- **Ícones**: Lucide React
- **Formulários**: React Hook Form + Zod
- **Notificações**: Sonner

#### Backend
- **Framework**: Next.js API Routes
- **ORM**: Prisma 6.14.0
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (jsonwebtoken)
- **Hash de Senha**: bcryptjs

#### DevOps
- **Deploy**: Vercel
- **Analytics**: Vercel Analytics + Speed Insights
- **Testes**: Jest + Testing Library

### 8.2 Estrutura de Arquivos

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── (auth)/            # Grupo de rotas de autenticação
│   ├── admin/             # Rotas administrativas
│   ├── api/               # API Routes
│   ├── booster/           # Rotas do booster
│   ├── dashboard/         # Dashboard do cliente
│   └── games/             # Páginas de jogos
├── components/            # Componentes React
│   ├── common/            # Componentes reutilizáveis
│   ├── games/             # Componentes de jogos
│   ├── layout/            # Componentes de layout
│   ├── providers/         # Context providers
│   └── ui/                # Componentes UI (shadcn)
├── contexts/              # React Contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utilitários e helpers
├── types/                 # TypeScript types
└── __tests__/             # Testes
```

### 8.3 Variáveis de Ambiente

- `DATABASE_URL`: URL de conexão PostgreSQL
- `JWT_SECRET`: Chave secreta para assinatura JWT
- `JWT_EXPIRES_IN`: Tempo de expiração do token (padrão: 7d)
- `NEXT_PUBLIC_SITE_URL`: URL pública do site
- `NODE_ENV`: Ambiente (development, production)

---

## Requisitos Não-Funcionais

### 9.1 Performance

- **RFN-001**: Página inicial deve carregar em menos de 2 segundos
- **RFN-002**: API deve responder em menos de 500ms (p95)
- **RFN-003**: Build de produção deve otimizar bundle size
- **RFN-004**: Imagens devem ser otimizadas (WebP, AVIF)
- **RFN-005**: Fontes devem usar `display: swap` para melhor performance

### 9.2 Escalabilidade

- **RFN-006**: Sistema deve suportar 1000+ usuários simultâneos
- **RFN-007**: Banco de dados deve ter índices otimizados
- **RFN-008**: Queries devem ser eficientes (uso de índices)

### 9.3 Usabilidade

- **RFN-009**: Interface deve ser responsiva (mobile-first)
- **RFN-010**: Navegação deve ser intuitiva
- **RFN-011**: Feedback visual para todas as ações do usuário
- **RFN-012**: Mensagens de erro claras e objetivas

### 9.4 Confiabilidade

- **RFN-013**: Sistema deve ter 99.9% de uptime
- **RFN-014**: Erros devem ser logados para debugging
- **RFN-015**: Validações devem prevenir dados inválidos

### 9.5 Manutenibilidade

- **RFN-016**: Código deve seguir padrões TypeScript
- **RFN-017**: Componentes devem ser reutilizáveis
- **RFN-018**: Testes devem cobrir funcionalidades críticas
- **RFN-019**: Documentação deve estar atualizada

### 9.6 Acessibilidade

- **RFN-020**: Componentes devem seguir padrões WCAG 2.1
- **RFN-021**: Navegação por teclado deve funcionar
- **RFN-022**: Contraste de cores adequado

---

## Segurança

### 10.1 Autenticação

- **SEG-001**: Senhas devem ser hasheadas com bcrypt (salt rounds: 10)
- **SEG-002**: Tokens JWT devem ser assinados com secret key
- **SEG-003**: Tokens devem expirar após período definido
- **SEG-004**: Rotas protegidas devem validar token

### 10.2 Autorização

- **SEG-005**: Middleware deve verificar role do usuário
- **SEG-006**: Usuário só pode acessar seus próprios recursos
- **SEG-007**: Admin pode acessar todos os recursos

### 10.3 Validação de Dados

- **SEG-008**: Inputs devem ser validados no frontend e backend
- **SEG-009**: SQL Injection prevenido via Prisma ORM
- **SEG-010**: XSS prevenido via sanitização de inputs

### 10.4 Proteção de Dados

- **SEG-011**: Dados sensíveis não devem ser expostos em logs
- **SEG-012**: CORS configurado adequadamente
- **SEG-013**: HTTPS obrigatório em produção

---

## Integrações

### 11.1 Integrações Atuais

- **INT-001**: Vercel Analytics (análise de uso)
- **INT-002**: Vercel Speed Insights (métricas de performance)
- **INT-003**: PostgreSQL (banco de dados)

### 11.2 Integrações Futuras

- **INT-004**: Gateway de pagamento (Mercado Pago, PagSeguro) para webhooks automáticos
- **INT-005**: Serviço de email (SendGrid, Resend) para notificações
- **INT-006**: Serviço de SMS para notificações importantes
- **INT-007**: Sistema de saque integrado com PIX

---

## Glossário

- **Boost**: Serviço de melhoria de rank/rating em jogos
- **Booster**: Profissional que executa serviços de boost
- **Premier**: Sistema de rating do Counter-Strike 2
- **Gamers Club**: Plataforma de ranqueamento brasileira para CS2
- **PIX**: Sistema de pagamento instantâneo brasileiro
- **Comissão**: Valor pago ao booster após conclusão do serviço
- **Receita**: Valor recebido pelo admin após conclusão do serviço
- **Escrow**: Sistema de custódia onde dinheiro fica retido até conclusão

---

## Histórico de Versões

| Versão | Data | Descrição | Autor |
|--------|------|-----------|-------|
| 1.0.0 | 2024-11 | Versão inicial do documento | Equipe GameBoost |

---

**Última atualização**: Novembro 2024  
**Status**: ✅ Documento Ativo  
**Versão do Projeto**: 1.0.0

