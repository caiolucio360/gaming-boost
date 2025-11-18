# Troubleshooting - Vercel Analytics e Speed Insights

Este documento ajuda a resolver problemas com o Vercel Analytics e Speed Insights que não estão gerando dados em produção.

## ✅ Configuração Atual

O projeto está configurado com:

1. **Pacotes instalados:**
   - `@vercel/analytics@^1.5.0`
   - `@vercel/speed-insights@^1.2.0`

2. **Componente Analytics:**
   - Localizado em: `src/components/providers/analytics-provider.tsx`
   - Importações corretas: `@vercel/analytics/react` e `@vercel/speed-insights/react`
   - Marcado como `'use client'` para funcionar no App Router

3. **Layout:**
   - Componente `<AnalyticsProvider />` adicionado no `src/app/layout.tsx`
   - Posicionado dentro do `<body>`, após todo o conteúdo

## 🔍 Verificações Necessárias

### 1. Verificar se os Serviços Estão Habilitados no Dashboard da Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Analytics**
4. Verifique se **Web Analytics** está **ativado**
5. Vá em **Settings** → **Speed Insights**
6. Verifique se **Speed Insights** está **ativado**

**⚠️ IMPORTANTE:** Se não estiverem ativados, ative-os e faça um novo deploy.

### 2. Verificar se os Scripts Estão Sendo Carregados

1. Abra o site em produção no navegador
2. Abra o DevTools (F12)
3. Vá na aba **Network**
4. Filtre por "insights" ou "script.js"
5. Procure por requisições para:
   - `/_vercel/insights/script.js` (deve retornar status 200)
   - `/_vercel/insights/view` (requisições POST)

**Se não aparecerem:**
- Os scripts não estão sendo carregados
- Pode haver um problema com o build ou deploy

### 3. Verificar o Código-Fonte da Página

1. Abra o site em produção
2. Clique com botão direito → **Ver código-fonte da página**
3. Procure por `/_vercel/insights/script.js` no HTML
4. Deve aparecer algo como:
   ```html
   <script src="/_vercel/insights/script.js" defer></script>
   ```

**Se não aparecer:**
- O componente Analytics não está sendo renderizado
- Verifique se o build foi feito corretamente

### 4. Verificar Bloqueadores de Anúncios

Bloqueadores de anúncios (como uBlock Origin, AdBlock) podem bloquear scripts de analytics.

**Solução:**
- Teste em modo anônimo sem extensões
- Ou adicione uma exceção para o seu domínio

### 5. Verificar Proxies/CDN

Se você usa Cloudflare ou outro proxy/CDN:

1. Verifique se as rotas `/_vercel/insights/*` não estão sendo bloqueadas
2. Configure regras para permitir essas rotas
3. Certifique-se de que o proxy está encaminhando corretamente para a Vercel

### 6. Verificar Ambiente de Produção

**⚠️ IMPORTANTE:** O Analytics e Speed Insights **SÓ funcionam em produção**, não em desenvolvimento local.

- ✅ Funciona: Deploy na Vercel (produção)
- ❌ Não funciona: `npm run dev` (desenvolvimento local)
- ❌ Não funciona: Preview deployments (a menos que configurado)

### 7. Aguardar Propagação dos Dados

Após fazer deploy:
- Os dados podem levar **alguns minutos** para aparecer
- Em alguns casos, pode levar até **2 horas**
- Faça algumas navegações no site e aguarde

## 🛠️ Soluções Comuns

### Solução 1: Reinstalar os Pacotes

```bash
npm uninstall @vercel/analytics @vercel/speed-insights
npm install @vercel/analytics @vercel/speed-insights
```

Depois, faça um novo deploy.

### Solução 2: Verificar Versões dos Pacotes

Certifique-se de que está usando versões compatíveis:

```json
{
  "@vercel/analytics": "^1.5.0",
  "@vercel/speed-insights": "^1.2.0"
}
```

### Solução 3: Verificar Importações

Para Next.js 15 com App Router, use:

```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
```

**NÃO use:**
- `@vercel/analytics/next` (para versões antigas)
- `@vercel/speed-insights/next` (pode não funcionar corretamente)

### Solução 4: Verificar se o Componente é Client Component

O componente Analytics deve ser um Client Component:

```typescript
'use client'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
```

### Solução 5: Verificar Posicionamento no Layout

O componente deve estar dentro do `<body>`:

```tsx
<body>
  {/* ... conteúdo ... */}
  <AnalyticsProvider />
</body>
```

## 📊 Como Verificar se Está Funcionando

### No Dashboard da Vercel:

1. Acesse **Analytics** no menu do projeto
2. Você deve ver:
   - Gráficos de visitas
   - Páginas mais visitadas
   - Dados de tráfego

3. Acesse **Speed Insights** no menu do projeto
4. Você deve ver:
   - Métricas de performance
   - Core Web Vitals
   - Dados de velocidade

### No Console do Navegador:

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Não deve haver erros relacionados a `/_vercel/insights`

## 🚨 Problemas Conhecidos

### Problema: Analytics funciona mas Speed Insights não (ou vice-versa)

**Causa:** Pode ser um problema temporário da Vercel ou configuração específica.

**Solução:** Aguarde algumas horas e verifique novamente. Se persistir, entre em contato com o suporte da Vercel.

### Problema: Dados aparecem com atraso

**Causa:** Normal. Os dados podem levar até 2 horas para aparecer.

**Solução:** Aguarde e continue navegando no site.

### Problema: Dados não aparecem mesmo após todas as verificações

**Causa:** Pode ser necessário verificar configurações específicas do projeto na Vercel.

**Solução:**
1. Entre em contato com o suporte da Vercel
2. Forneça:
   - URL do projeto
   - Screenshots do código-fonte mostrando os scripts
   - Logs do console do navegador

## 📚 Recursos Adicionais

- [Documentação Vercel Analytics](https://vercel.com/docs/analytics)
- [Documentação Speed Insights](https://vercel.com/docs/speed-insights)
- [Troubleshooting Analytics](https://vercel.com/docs/analytics/troubleshooting)
- [Troubleshooting Speed Insights](https://vercel.com/docs/speed-insights/troubleshooting)
- [Comunidade Vercel](https://community.vercel.com/)

## ✅ Checklist Final

Antes de reportar um problema, verifique:

- [ ] Analytics e Speed Insights estão ativados no Dashboard da Vercel
- [ ] Os pacotes estão instalados corretamente
- [ ] As importações estão corretas (`/react` para Next.js 15)
- [ ] O componente está marcado como `'use client'`
- [ ] O componente está no layout principal dentro do `<body>`
- [ ] O build foi feito corretamente
- [ ] O deploy foi feito em produção
- [ ] Os scripts aparecem no código-fonte da página
- [ ] Não há bloqueadores de anúncios interferindo
- [ ] Aguardou pelo menos 30 minutos após o deploy

