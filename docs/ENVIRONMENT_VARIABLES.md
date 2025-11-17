# Variáveis de Ambiente

Este documento lista todas as variáveis de ambiente necessárias para o projeto Gaming Boost.

## 📋 Variáveis Obrigatórias

### `DATABASE_URL`
- **Descrição**: URL de conexão com o banco de dados PostgreSQL
- **Formato**: `postgresql://usuario:senha@host:porta/database`
- **Exemplo**: `postgresql://postgres:senha123@localhost:5432/gaming_boost`
- **Onde é usado**: Prisma (`prisma/schema.prisma`)
- **Obrigatória**: ✅ Sim

### `NEXTAUTH_SECRET`
- **Descrição**: Secret key para NextAuth.js (autenticação)
- **Como gerar**: `openssl rand -base64 32`
- **Onde é usado**: `src/lib/auth-config.ts`
- **Obrigatória**: ✅ Sim (NextAuth requer esta variável)

### `JWT_SECRET`
- **Descrição**: Secret key para assinatura de tokens JWT
- **Como gerar**: `openssl rand -base64 32`
- **Onde é usado**: `src/lib/jwt.ts`
- **Obrigatória**: ⚠️ Recomendada (tem fallback para desenvolvimento, mas **NÃO use em produção**)

## 📋 Variáveis Opcionais

### `JWT_EXPIRES_IN`
- **Descrição**: Tempo de expiração dos tokens JWT
- **Padrão**: `7d` (7 dias)
- **Formatos aceitos**: `1d`, `7d`, `1h`, `30m`, etc.
- **Onde é usado**: `src/lib/jwt.ts`
- **Obrigatória**: ❌ Não

### `NEXT_PUBLIC_SITE_URL`
- **Descrição**: URL base do site (usado para SEO, sitemap, robots.txt)
- **Padrão**: `https://gameboostpro.com.br`
- **Exemplo**: `https://gameboostpro.com.br`
- **Onde é usado**: 
  - `src/lib/seo.ts`
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
  - `src/app/layout.tsx`
- **Obrigatória**: ❌ Não (mas recomendada para produção)

### `NEXT_PUBLIC_API_URL`
- **Descrição**: URL base da API
- **Padrão**: `""` (string vazia - requisições relativas)
- **Exemplo**: `https://api.gameboostpro.com.br`
- **Onde é usado**: `src/lib/api-client.ts`
- **Obrigatória**: ❌ Não

### `NODE_ENV`
- **Descrição**: Ambiente de execução
- **Valores**: `development`, `production`, `test`
- **Padrão**: Definido automaticamente pelo Next.js
- **Onde é usado**: 
  - `src/lib/db.ts` (logs do Prisma)
  - `src/app/api/admin/stats/route.ts` (mensagens de erro)
- **Obrigatória**: ❌ Não (gerenciada automaticamente)

## 🚀 Configuração Rápida

### 1. Criar arquivo `.env.local`

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/gaming_boost"

# Autenticação
JWT_SECRET="gere-uma-chave-aleatoria-aqui"
NEXTAUTH_SECRET="gere-outra-chave-aleatoria-aqui"
JWT_EXPIRES_IN="7d"

# URLs
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL=""
```

### 2. Gerar Secrets

Para gerar secrets seguros, use um dos comandos abaixo:

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**PowerShell (Windows):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Configuração por Ambiente

#### Desenvolvimento (`.env.local`)
```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/gaming_boost_dev"
JWT_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_SECRET="dev-nextauth-secret-change-in-production"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NODE_ENV="development"
```

#### Produção (`.env.production`)
```env
DATABASE_URL="postgresql://usuario:senha@host-producao:5432/gaming_boost"
JWT_SECRET="[GERE-UM-SECRET-FORTE-AQUI]"
NEXTAUTH_SECRET="[GERE-UM-SECRET-FORTE-AQUI]"
NEXT_PUBLIC_SITE_URL="https://gameboostpro.com.br"
NEXT_PUBLIC_API_URL="https://api.gameboostpro.com.br"
NODE_ENV="production"
```

## ⚠️ Segurança

1. **NUNCA** commite arquivos `.env` ou `.env.local` no Git
2. **SEMPRE** use secrets fortes em produção
3. **NUNCA** compartilhe secrets em canais públicos
4. Use variáveis de ambiente do seu provedor de hospedagem (Vercel, Railway, etc.)

## 📝 Notas

- Variáveis com prefixo `NEXT_PUBLIC_` são expostas ao cliente (browser)
- Variáveis sem `NEXT_PUBLIC_` são apenas do lado do servidor
- O Next.js carrega automaticamente arquivos `.env.local`, `.env.development`, `.env.production`
- Arquivos `.env.local` têm prioridade sobre outros arquivos `.env`

