# GameBoost

Plataforma web full-stack para serviços de boost em jogos eletrônicos, desenvolvida com Next.js 15 e TypeScript.

## 🛠️ Stack

### Frontend
- **Next.js 15.5.6** - Framework React com App Router
- **React 19.1.0** - Biblioteca UI
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 4.1.17** - Estilização utility-first
- **shadcn/ui** - Componentes acessíveis baseados em Radix UI
- **React Hook Form + Zod** - Validação de formulários
- **Lucide React** - Biblioteca de ícones

### Backend
- **Next.js API Routes** - Endpoints RESTful
- **Prisma 6.19.0** - ORM type-safe
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação stateless
- **bcryptjs** - Hash de senhas

### DevOps & Qualidade
- **Jest + Testing Library** - Testes unitários e de integração
- **ESLint** - Linting de código
- **TypeScript** - Type checking em tempo de compilação
- **Vercel** - Deploy e hosting

## 📐 Arquitetura e Padrões

### Arquitetura
- **App Router (Next.js 15)** - Roteamento baseado em sistema de arquivos
- **Server Components** - Renderização no servidor por padrão
- **API Routes** - Endpoints RESTful integrados ao framework
- **Middleware Pattern** - Autenticação e autorização centralizadas

### Padrões de Código
- **Component-Based Architecture** - Componentes React reutilizáveis
- **Custom Hooks** - Lógica compartilhada (`useAuth`, `useLoading`, `useCart`)
- **Context API** - Gerenciamento de estado global (Auth, Cart)
- **Type-Safe APIs** - TypeScript em todo o stack
- **Separation of Concerns** - Separação clara entre UI, lógica e dados

### Estrutura de Pastas
```
src/
├── app/              # Rotas Next.js (App Router)
│   ├── (auth)/      # Route Groups
│   ├── api/         # API Routes
│   └── [pages]/     # Páginas da aplicação
├── components/       # Componentes React
│   ├── ui/          # Componentes base (shadcn/ui)
│   ├── common/      # Componentes reutilizáveis
│   └── layout/      # Componentes de layout
├── contexts/         # React Contexts
├── hooks/           # Custom Hooks
├── lib/             # Utilitários e helpers
└── types/           # TypeScript types
```

### Padrões de Banco de Dados
- **Prisma ORM** - Type-safe database access
- **Migrations** - Versionamento de schema
- **Indexes** - Otimização de queries
- **Relations** - Relacionamentos bem definidos
- **Enums** - Tipos enumerados para consistência

## ✨ Destaques Técnicos

### Performance
- **Code Splitting** - Lazy loading de componentes pesados
- **Image Optimization** - Next.js Image com formatos modernos (WebP, AVIF)
- **Font Optimization** - Google Fonts com `display: swap`
- **Bundle Optimization** - Tree shaking e minificação
- **Dynamic Imports** - Carregamento sob demanda de analytics

### SEO
- **Metadata API** - Metadata dinâmica por página
- **Open Graph** - Compartilhamento em redes sociais
- **Sitemap Dinâmico** - Geração automática de sitemap
- **Robots.txt** - Configuração de crawlers

### Qualidade de Código
- **TypeScript Strict Mode** - Type safety em todo o projeto
- **ESLint** - Padrões de código consistentes
- **139 Testes** - Cobertura de funcionalidades críticas
- **Error Boundaries** - Tratamento de erros

### UX/UI
- **Responsive Design** - Mobile-first approach
- **Loading States** - Feedback visual durante carregamento
- **Toast Notifications** - Feedback de ações do usuário
- **Accessibility** - Componentes acessíveis (WCAG 2.1)

## 🔐 Segurança

- **JWT Authentication** - Tokens stateless com expiração
- **Password Hashing** - bcrypt com salt rounds
- **Role-Based Access Control** - Autorização por perfil (CLIENT, BOOSTER, ADMIN)
- **Input Validation** - Validação no frontend e backend
- **SQL Injection Prevention** - Prisma ORM protege contra SQL injection
- **XSS Prevention** - Sanitização de inputs

## 📊 Métricas

- **139 Testes** - Cobertura de APIs e componentes
- **TypeScript** - 100% do código tipado
- **Build Time** - ~9-16s
- **Bundle Size** - Otimizado com code splitting

## 🚀 Scripts

```bash
npm run dev          # Desenvolvimento com Turbopack
npm run build        # Build de produção
npm run start        # Servidor de produção
npm test             # Executar testes
npm run lint         # Verificar código
```

## 📚 Documentação

Documentação técnica completa disponível em [`docs/`](./docs/):
- Requisitos do projeto
- Schema do banco de dados
- Guias de autenticação e rotas
- Fluxos de pagamento

---

**Status**: ✅ Produção Ready  
**Versão**: 1.0.0
