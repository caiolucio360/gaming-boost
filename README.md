# GameBoost 🎮

Plataforma web full-stack para serviços de boost em jogos eletrônicos, desenvolvida com Next.js 15 e TypeScript. Conecta jogadores que precisam de boost com boosters profissionais de forma segura e eficiente.

## ✨ Funcionalidades

### Para Clientes
- 🛒 **Sistema de Carrinho** - Adicione múltiplos serviços ao carrinho
- 💳 **Pagamento PIX** - Integração com AbacatePay para pagamentos instantâneos
- 📊 **Acompanhamento de Pedidos** - Acompanhe o status dos seus boosts em tempo real
- ⭐ **Sistema de Avaliações** - Avalie os boosters após o serviço
- 🔔 **Notificações em Tempo Real** - Receba atualizações instantâneas sobre seus pedidos
- 👤 **Perfil Completo** - Gerencie suas informações e histórico de pedidos

### Para Boosters
- 📝 **Sistema de Aplicação** - Candidate-se para ser booster
- 💰 **Gestão de Pagamentos** - Acompanhe seus ganhos e solicite saques
- 📋 **Painel de Pedidos** - Gerencie todos os seus pedidos em um só lugar
- 📊 **Histórico de Comissões** - Visualize seu histórico de ganhos
- 🏆 **Perfil Público** - Mostre suas habilidades e avaliações

### Para Administradores
- 👥 **Gestão de Usuários** - Gerencie clientes, boosters e administradores
- 📦 **Gestão de Pedidos** - Acompanhe e gerencie todos os pedidos da plataforma
- 💵 **Sistema de Comissões** - Configure e gerencie comissões por jogo
- 💳 **Gestão de Pagamentos** - Aprove e gerencie pagamentos de boosters
- ⚖️ **Sistema de Disputas** - Resolva conflitos entre clientes e boosters
- 📊 **Dashboard Analytics** - Visualize estatísticas da plataforma

## 🎯 Jogos Suportados

- **Counter-Strike 2 (CS2)**
  - Boost de Rank Premier (1K - 26K pontos)
  - Boost Gamers Club (Níveis 1-20)
  - Sistema de preços progressivos por faixa de rating

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15.5.6** - Framework React com App Router e Server Components
- **React 19.1.0** - Biblioteca UI com hooks modernos
- **TypeScript 5.9.3** - Type safety em todo o projeto
- **Tailwind CSS 4.1.17** - Estilização utility-first
- **shadcn/ui** - Componentes acessíveis baseados em Radix UI
- **React Hook Form + Zod** - Validação de formulários type-safe
- **Lucide React** - Biblioteca de ícones moderna
- **next-themes** - Suporte a tema claro/escuro
- **Sonner** - Sistema de notificações toast

### Backend
- **Next.js API Routes** - Endpoints RESTful integrados
- **Prisma 6.19.0** - ORM type-safe com migrations
- **SQLite/PostgreSQL** - Banco de dados relacional
- **JWT (jsonwebtoken)** - Autenticação stateless
- **bcryptjs** - Hash seguro de senhas
- **NextAuth.js** - Sistema de autenticação completo
- **AbacatePay SDK** - Integração de pagamentos PIX

### DevOps & Qualidade
- **Jest + Testing Library** - Testes unitários e de integração (139+ testes)
- **ESLint** - Linting de código com configuração Next.js
- **TypeScript Strict Mode** - Type checking rigoroso
- **@axe-core/react** - Auditoria de acessibilidade em desenvolvimento
- **Vercel Analytics & Speed Insights** - Monitoramento de performance
- **Turbopack** - Build rápido em desenvolvimento

## 📐 Arquitetura e Padrões

### Arquitetura
- **App Router (Next.js 15)** - Roteamento baseado em sistema de arquivos
- **Server Components** - Renderização no servidor por padrão para melhor performance
- **API Routes** - Endpoints RESTful integrados ao framework
- **Middleware Pattern** - Autenticação e autorização centralizadas
- **Route Groups** - Organização de rotas com `(auth)`, `(dashboard)`

### Padrões de Código
- **Component-Based Architecture** - Componentes React reutilizáveis e modulares
- **Custom Hooks** - Lógica compartilhada (`useAuth`, `useLoading`, `useCart`, `useRealtime`)
- **Context API** - Gerenciamento de estado global (Auth, Cart)
- **Type-Safe APIs** - TypeScript em todo o stack com tipos compartilhados
- **Separation of Concerns** - Separação clara entre UI, lógica e dados
- **Provider Pattern** - Providers para temas, analytics, acessibilidade

### Estrutura de Pastas
```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── (auth)/            # Route Groups - Páginas de autenticação
│   ├── (dashboard)/       # Route Groups - Páginas do dashboard
│   ├── api/               # API Routes
│   │   ├── admin/         # Endpoints administrativos
│   │   ├── auth/          # Autenticação
│   │   ├── booster/       # Endpoints para boosters
│   │   ├── disputes/      # Sistema de disputas
│   │   ├── orders/        # Gestão de pedidos
│   │   ├── payment/       # Pagamentos
│   │   └── webhooks/      # Webhooks externos
│   ├── admin/             # Painel administrativo
│   ├── booster/           # Área do booster
│   ├── cart/              # Carrinho de compras
│   └── [pages]/           # Páginas públicas
├── components/             # Componentes React
│   ├── ui/                # Componentes base (shadcn/ui)
│   ├── common/            # Componentes reutilizáveis
│   ├── layout/            # Componentes de layout
│   ├── booster/           # Componentes específicos de boosters
│   ├── games/             # Componentes de jogos
│   ├── payment/           # Componentes de pagamento
│   └── providers/         # Context Providers
├── contexts/               # React Contexts (Auth, Cart)
├── hooks/                 # Custom Hooks
├── lib/                   # Utilitários e helpers
│   ├── db.ts              # Cliente Prisma
│   ├── auth-config.ts     # Configuração NextAuth
│   ├── games-config.ts    # Configuração de jogos
│   └── abacatepay.ts      # Integração de pagamentos
├── types/                  # TypeScript types
└── __tests__/             # Testes unitários e de integração
```

### Padrões de Banco de Dados
- **Prisma ORM** - Type-safe database access com geração automática de tipos
- **Migrations** - Versionamento de schema com histórico completo
- **Indexes** - Otimização de queries com índices estratégicos
- **Relations** - Relacionamentos bem definidos (User, Order, Payment, etc.)
- **Enums** - Tipos enumerados para consistência (UserRole, OrderStatus, etc.)
- **Seeds** - Dados iniciais para desenvolvimento e testes

## ✨ Destaques Técnicos

### Performance
- **Code Splitting** - Lazy loading automático de componentes pesados
- **Image Optimization** - Next.js Image com formatos modernos (WebP, AVIF)
- **Font Optimization** - Google Fonts com `display: swap`
- **Bundle Optimization** - Tree shaking e minificação automática
- **Dynamic Imports** - Carregamento sob demanda de analytics e acessibilidade
- **Optimize Package Imports** - Importações otimizadas de bibliotecas grandes
- **Turbopack** - Build extremamente rápido em desenvolvimento

### SEO
- **Metadata API** - Metadata dinâmica por página com Next.js 15
- **Open Graph** - Compartilhamento otimizado em redes sociais
- **Sitemap Dinâmico** - Geração automática de sitemap XML
- **Robots.txt** - Configuração dinâmica de crawlers
- **Structured Data** - Dados estruturados para melhor indexação

### Qualidade de Código
- **TypeScript Strict Mode** - Type safety em todo o projeto
- **ESLint** - Padrões de código consistentes com configuração Next.js
- **139+ Testes** - Cobertura de APIs, componentes e lógica de negócio
- **Error Boundaries** - Tratamento robusto de erros
- **Type-Safe Database** - Prisma gera tipos automaticamente do schema

### UX/UI
- **Responsive Design** - Mobile-first approach com Tailwind CSS
- **Loading States** - Feedback visual durante carregamento
- **Toast Notifications** - Feedback de ações do usuário com Sonner
- **Dark Mode** - Suporte completo a tema claro/escuro
- **Accessibility** - Componentes acessíveis (WCAG 2.1 Level AA)
  - Auditoria automática com @axe-core/react em desenvolvimento
  - Navegação por teclado
  - Suporte a leitores de tela
  - Contraste adequado de cores

## 🔐 Segurança

- **JWT Authentication** - Tokens stateless com expiração configurável
- **Password Hashing** - bcrypt com salt rounds para segurança máxima
- **Role-Based Access Control** - Autorização por perfil (CLIENT, BOOSTER, ADMIN)
- **Input Validation** - Validação no frontend (Zod) e backend (Prisma)
- **SQL Injection Prevention** - Prisma ORM protege contra SQL injection
- **XSS Prevention** - Sanitização automática de inputs
- **CSRF Protection** - Proteção contra Cross-Site Request Forgery
- **Secure Headers** - Headers de segurança configurados
- **Environment Variables** - Variáveis sensíveis em `.env`

## 💳 Sistema de Pagamentos

- **AbacatePay Integration** - Integração completa com gateway PIX
- **Webhooks** - Processamento assíncrono de confirmações de pagamento
- **Sistema de Comissões** - Configuração flexível de comissões por jogo
- **Histórico de Pagamentos** - Rastreamento completo de transações
- **Gestão de Saques** - Sistema para boosters solicitarem saques

## 📊 Métricas e Performance

- **139+ Testes** - Cobertura de APIs, componentes e lógica de negócio
- **TypeScript** - 100% do código tipado com strict mode
- **Build Time** - ~9-18s (otimizado)
- **Bundle Size** - Otimizado com code splitting automático
- **First Load JS** - ~100-210 KB (dependendo da rota)
- **58 Rotas** - Páginas estáticas e dinâmicas otimizadas

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento com Turbopack
npm run build            # Build de produção (Prisma + Next.js)
npm run start            # Servidor de produção

# Qualidade de Código
npm run lint             # Verificar código com ESLint
npm run lint:fix          # Corrigir problemas de lint automaticamente

# Testes
npm test                 # Executar todos os testes
npm run test:watch       # Modo watch para desenvolvimento
npm run test:coverage    # Gerar relatório de cobertura

# Banco de Dados
npm run db:generate      # Gerar Prisma Client
npm run db:push          # Aplicar mudanças no schema
npm run db:studio        # Abrir Prisma Studio (GUI)
npm run db:seed          # Popular banco com dados iniciais
```

## 🚀 Como Começar

### Pré-requisitos
- Node.js 20+ 
- npm ou yarn
- Banco de dados (SQLite para desenvolvimento ou PostgreSQL para produção)

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd gaming-boost
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

4. **Configure o banco de dados**
```bash
npm run db:push
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Acesse a aplicação**
```
http://localhost:3000
```

### Variáveis de Ambiente

Principais variáveis necessárias:
- `DATABASE_URL` - URL de conexão do banco de dados
- `NEXTAUTH_SECRET` - Chave secreta para JWT
- `NEXTAUTH_URL` - URL base da aplicação
- `ABACATEPAY_API_KEY` - Chave da API AbacatePay (opcional para desenvolvimento)

## 📚 Documentação Adicional

Documentação técnica disponível em [`docs/`](./docs/):
- README com informações gerais

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e proprietário.

---

**Status**: ✅ Produção Ready  
**Versão**: 0.2.0  
**Última Atualização**: 2024
