# Documentação do Projeto

Esta pasta contém toda a documentação técnica do projeto GameBoost Pro.

## 📚 Documentos Disponíveis

### [REQUISITOS.md](./REQUISITOS.md)
**Documento de Requisitos do Projeto** - Documentação completa e abrangente incluindo:
- Visão geral e objetivos do projeto
- Perfis de usuário (Cliente, Booster, Administrador)
- Funcionalidades detalhadas por perfil
- Regras de negócio completas
- Fluxos principais de uso
- Modelo de dados
- Requisitos técnicos e não-funcionais
- Segurança e integrações

### [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
Documentação completa do schema do banco de dados, incluindo:
- Todas as entidades (User, Service, Order, Payment)
- Relacionamentos entre entidades
- Enums e tipos
- Índices e otimizações
- Regras de negócio

### [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)
Guia completo do sistema de autenticação:
- Fluxo de autenticação JWT
- Implementação frontend e backend
- Gerenciamento de tokens
- Proteção de rotas
- Persistência de sessão

### [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
Guia de migração do banco de dados:
- Configuração do banco PostgreSQL (Neon)
- Migração do SQLite para PostgreSQL
- Comandos Prisma
- Variáveis de ambiente

### [ROUTES.md](./ROUTES.md)
Árvore completa de rotas da aplicação:
- Rotas públicas e protegidas
- Rotas de API com métodos HTTP
- Níveis de acesso por role
- Redirecionamentos automáticos
- Estrutura de arquivos

### [TOAST_USAGE.md](./TOAST_USAGE.md)
Guia de uso do sistema de notificações:
- Sistema de toast com Sonner
- Funções helper para sucesso e erro
- Componentes de mensagem inline
- Error Boundary
- Exemplos práticos

### [SERVICE_SELECTION_LOGIC.md](./SERVICE_SELECTION_LOGIC.md)
Lógica de seleção de serviços para itens do carrinho:
- Como o app decide qual serviço vincular
- Prioridades de seleção (Customizado → Modo → Genérico)
- Serviços específicos vs genéricos
- Fluxo de decisão completo

### [PRICING_STRATEGY.md](./PRICING_STRATEGY.md)
Estratégia de precificação e análise de mercado:
- Pesquisa de concorrentes
- Preços competitivos por modo
- Tabela de referência
- Recomendações futuras

## 📖 Como Usar

1. **Para entender o projeto completo**: Comece com `REQUISITOS.md` - documento principal com todos os requisitos, funcionalidades e regras de negócio
2. Para entender a estrutura do banco de dados, consulte `DATABASE_SCHEMA.md`
3. Para implementar ou entender a autenticação, consulte `AUTHENTICATION_GUIDE.md`
4. Para migrar ou configurar o banco de dados, consulte `MIGRATION_GUIDE.md`
5. Para navegar e entender todas as rotas, consulte `ROUTES.md`
6. Para usar notificações toast e tratamento de erros, consulte `TOAST_USAGE.md`

## 🔄 Atualizações

Esta documentação é mantida atualizada conforme o projeto evolui. Sempre consulte a versão mais recente antes de fazer alterações significativas no código.

---

**Última atualização**: 2024

