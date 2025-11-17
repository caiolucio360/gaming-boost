# Guia de Deploy na Vercel

Este guia explica como configurar variáveis de ambiente na Vercel e boas práticas de segurança.

## 🚫 NUNCA Commite Arquivos .env

### ❌ O que NÃO deve ser commitado:

- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- Qualquer arquivo que contenha secrets reais

### ✅ O que PODE ser commitado:

- `.env.example` (arquivo de exemplo sem valores reais)
- Documentação sobre variáveis de ambiente

O projeto já está configurado corretamente no `.gitignore` para ignorar arquivos `.env*`.

## 🔐 Configurando Variáveis de Ambiente na Vercel

### Método 1: Via Dashboard da Vercel (Recomendado)

1. **Acesse o Dashboard da Vercel**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login na sua conta

2. **Selecione seu Projeto**
   - Clique no projeto `gaming-boost`

3. **Acesse as Configurações**
   - Clique em **Settings** (Configurações)
   - No menu lateral, clique em **Environment Variables** (Variáveis de Ambiente)

4. **Adicione as Variáveis**
   - Clique em **Add New** (Adicionar Nova)
   - Preencha:
     - **Key**: Nome da variável (ex: `DATABASE_URL`)
     - **Value**: Valor da variável
     - **Environment**: Selecione onde aplicar:
       - ✅ **Production** (produção)
       - ✅ **Preview** (preview/staging)
       - ✅ **Development** (desenvolvimento local via Vercel CLI)
   - Clique em **Save**

5. **Repita para todas as variáveis necessárias**

### Método 2: Via Vercel CLI

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Adicionar variável de ambiente
vercel env add DATABASE_URL production
# Digite o valor quando solicitado

# Adicionar para múltiplos ambientes
vercel env add JWT_SECRET production preview development
```

## 📋 Lista de Variáveis para Adicionar na Vercel

### Variáveis Obrigatórias

Adicione estas variáveis na Vercel:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/gaming_boost
JWT_SECRET=[gere-um-secret-forte]
NEXTAUTH_SECRET=[gere-um-secret-forte]
```

### Variáveis Opcionais (Recomendadas)

```env
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_SITE_URL=https://gameboostpro.com.br
NEXT_PUBLIC_API_URL=
```

## 🎯 Configuração por Ambiente

Na Vercel, você pode configurar variáveis diferentes para cada ambiente:

### Production (Produção)
- Use valores reais de produção
- Secrets fortes e únicos
- URL do site de produção

### Preview (Staging/Preview)
- Pode usar banco de dados de staging
- Secrets diferentes de produção
- URL do preview (geralmente automática)

### Development (Desenvolvimento Local)
- Valores para desenvolvimento local
- Geralmente não necessário se você usa `.env.local`

## 🔄 Após Adicionar Variáveis

1. **Redeploy é Necessário**
   - Após adicionar/modificar variáveis, você precisa fazer um novo deploy
   - Vá para a aba **Deployments**
   - Clique nos três pontos (⋯) do último deployment
   - Selecione **Redeploy**

2. **Ou faça um novo commit**
   - Faça qualquer alteração no código
   - Faça commit e push
   - A Vercel fará deploy automaticamente com as novas variáveis

## ✅ Verificando se as Variáveis Estão Configuradas

### Via Dashboard
1. Vá em **Settings** → **Environment Variables**
2. Verifique se todas as variáveis estão listadas
3. Verifique os ambientes marcados (Production, Preview, Development)

### Via Build Logs
1. Vá em **Deployments**
2. Clique no último deployment
3. Verifique os logs de build
4. Se houver erro de variável faltando, aparecerá nos logs

### Via Código (Apenas para Debug)
⚠️ **NUNCA faça isso em produção!**

```typescript
// Apenas para debug local
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ Faltando')
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurada' : '❌ Faltando')
```

## 🔒 Segurança na Vercel

### Boas Práticas

1. **Use Secrets Fortes**
   - Gere secrets únicos e fortes
   - Não reutilize secrets entre projetos

2. **Não Exponha Secrets**
   - Variáveis sem `NEXT_PUBLIC_` são seguras (apenas servidor)
   - Variáveis com `NEXT_PUBLIC_` são expostas ao cliente
   - **NUNCA** coloque secrets em variáveis `NEXT_PUBLIC_*`

3. **Rotacione Secrets Regularmente**
   - Se um secret for comprometido, altere imediatamente
   - Atualize na Vercel e faça redeploy

4. **Use Diferentes Secrets por Ambiente**
   - Production deve ter secrets diferentes de Preview/Development

5. **Limite Acesso ao Dashboard**
   - Apenas pessoas confiáveis devem ter acesso às variáveis de ambiente
   - Use Teams na Vercel para gerenciar permissões

## 🐛 Troubleshooting

### Problema: Variável não está disponível no código

**Soluções:**
1. Verifique se a variável está configurada no ambiente correto (Production/Preview)
2. Faça um redeploy após adicionar a variável
3. Verifique se o nome da variável está correto (case-sensitive)
4. Para variáveis `NEXT_PUBLIC_*`, elas são injetadas no build time

### Problema: Build falha por variável faltando

**Soluções:**
1. Verifique os logs de build na Vercel
2. Confirme que todas as variáveis obrigatórias estão configuradas
3. Verifique se está usando o ambiente correto

### Problema: Variável funciona localmente mas não na Vercel

**Soluções:**
1. Confirme que a variável está adicionada na Vercel
2. Verifique se está no ambiente correto (Production vs Preview)
3. Faça um redeploy
4. Variáveis `NEXT_PUBLIC_*` precisam estar configuradas antes do build

## 📝 Checklist de Deploy

Antes de fazer deploy na Vercel, verifique:

- [ ] Todas as variáveis obrigatórias estão configuradas
- [ ] Secrets são fortes e únicos
- [ ] `DATABASE_URL` aponta para o banco correto
- [ ] `NEXT_PUBLIC_SITE_URL` está configurada com a URL de produção
- [ ] Variáveis estão configuradas para o ambiente correto (Production)
- [ ] `.env.local` não está commitado no Git
- [ ] Build local funciona sem erros

## 🔗 Links Úteis

- [Documentação Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js - Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Documentação do Projeto - Variáveis de Ambiente](./ENVIRONMENT_VARIABLES.md)


