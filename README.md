# GameBoost Pro 🎮

Plataforma profissional para serviços de boost em **Counter-Strike 2**, oferecendo boost de rank em modos Premier e Gamers Club.

## 🚀 Sobre o Projeto

**GameBoost Pro** é uma plataforma web completa para serviços de boost profissional em Counter-Strike 2. A plataforma conecta clientes que desejam melhorar seus ranks com boosters profissionais que realizam os serviços.

## ✨ Funcionalidades Principais

### 🎯 Para Clientes
- ✅ Navegação livre pelo site sem necessidade de login
- ✅ Calculadora de preços dinâmica (Premier e Gamers Club)
- ✅ Sistema de carrinho com persistência
- ✅ Dashboard pessoal para acompanhamento de pedidos
- ✅ Sistema de pagamento via PIX
- ✅ Perfil do usuário com edição de dados

### 👨‍💼 Para Administradores
- ✅ Dashboard com estatísticas em tempo real
- ✅ Gerenciamento completo de usuários, serviços e pedidos
- ✅ Filtros e buscas avançadas

### ⚡ Para Boosters
- ✅ Visualização de pedidos disponíveis
- ✅ Aceitar e atualizar status de pedidos
- ✅ Dashboard com estatísticas de trabalho

## 🛠️ Tecnologias

- **Next.js 15.4.6** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Type safety
- **Tailwind CSS 4.0** - Estilização
- **shadcn/ui** - Componentes UI reutilizáveis
- **Prisma** - ORM para banco de dados
- **Jest** - Framework de testes

## 🚀 Instalação

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Gerar Prisma Client
npm run db:generate

# 3. Configurar banco de dados
npm run db:push

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🧪 Testes

O projeto possui **139 testes** cobrindo todas as funcionalidades principais.

```bash
# Executar todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Com coverage
npm run test:coverage
```

## 🎨 Destaques Técnicos

- ✅ **SEO Otimizado**: Metadata, Open Graph, Twitter Cards, Sitemap dinâmico
- ✅ **Validação de Negócio**: Máximo 1 boost ativo por modalidade
- ✅ **Navegação Otimizada**: Client-side navigation com Next.js Link
- ✅ **UX Aprimorada**: Sem "flickering", loading states separados
- ✅ **Design Responsivo**: Mobile-first, componentes acessíveis
- ✅ **Testes Abrangentes**: 95%+ de cobertura das APIs

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento

# Build e produção
npm run build            # Criar build de produção
npm run start            # Iniciar servidor de produção

# Banco de dados
npm run db:generate      # Gerar Prisma Client
npm run db:push          # Sincronizar schema com banco
npm run db:studio        # Abrir Prisma Studio

# Testes
npm test                 # Executar testes
npm run test:watch       # Modo watch
npm run test:coverage    # Com coverage

# Linting
npm run lint             # Verificar código
npm run lint:fix         # Corrigir problemas automaticamente
```

## 📄 Licença

Este projeto é privado e de propriedade da GameBoost Pro.

---

**Versão**: 1.0.0  
**Status**: ✅ Produção Ready
