# 🏆 Planejamento de Integração com Trustpilot — FlautasBoost

> **Documento**: Planejamento técnico e estratégico  
> **Projeto**: FlautasBoost (gaming-boost)  
> **Data**: 14/06/2026  
> **Status**: 📋 Planejamento (sem execução)

---

## 📌 Índice

1. [O que é o Trustpilot?](#1-o-que-é-o-trustpilot)
2. [Como funciona?](#2-como-funciona)
3. [Planos e Preços](#3-planos-e-preços)
4. [O que é possível no Plano Gratuito](#4-o-que-é-possível-no-plano-gratuito)
5. [Métodos de Integração](#5-métodos-de-integração)
6. [Recomendação para o FlautasBoost](#6-recomendação-para-o-flautasboost)
7. [Plano Técnico de Implementação](#7-plano-técnico-de-implementação)
8. [Variáveis de Ambiente](#8-variáveis-de-ambiente)
9. [Considerações de SEO](#9-considerações-de-seo)
10. [Considerações de LGPD/GDPR](#10-considerações-de-lgpdgdpr)
11. [Checklist de Pré-Requisitos](#11-checklist-de-pré-requisitos)
12. [Cronograma Estimado](#12-cronograma-estimado)

---

## 1. O que é o Trustpilot?

O **Trustpilot** é a maior plataforma de avaliações de consumidores do mundo. Funciona como um espaço onde clientes reais podem avaliar empresas com notas de 1 a 5 estrelas e deixar comentários sobre sua experiência.

### Por que é importante para o FlautasBoost?

- **Credibilidade**: Num mercado de boost/elojob, a confiança do cliente é CRUCIAL. Muitos clientes têm medo de golpes.
- **Prova social**: Avaliações reais de clientes satisfeitos convertem visitantes em compradores.
- **SEO**: O Trustpilot tem alta autoridade no Google. Avaliações aparecem nos resultados de busca (rich snippets com estrelas).
- **Diferencial competitivo**: Poucos concorrentes no nicho de boost usam Trustpilot, o que transmite profissionalismo.

---

## 2. Como funciona?

### Fluxo básico:

```
1. Empresa cria conta → 2. Reclama seu perfil → 3. Envia convites de avaliação
                                                            ↓
4. Cliente recebe email/link → 5. Avalia com estrelas + comentário
                                            ↓
6. Avaliação aparece no perfil público → 7. Widget exibe no seu site
```

### Detalhes do fluxo:

1. **Cadastro gratuito** em [business.trustpilot.com](https://business.trustpilot.com)
2. **Reivindicar o perfil** da empresa (associar ao domínio `flautasboost.com.br`)
3. **Convidar clientes** para avaliar (por email, link direto, ou automaticamente após compra)
4. **Clientes avaliam** no site do Trustpilot (1 a 5 estrelas + texto)
5. **Empresa responde** às avaliações (públicas)
6. **Widgets (TrustBoxes)** são colocados no site para exibir nota e avaliações

---

## 3. Planos e Preços

> ⚠️ **IMPORTANTE**: Todos os planos pagos exigem compromisso de **12 meses** e são cobrados **anualmente antecipados**.

| Plano | Preço (mensal) | Convites/mês | Widgets | Domínios | Recursos Principais |
|:------|:---------------|:-------------|:--------|:---------|:--------------------|
| **Free** | $0 | 50 | 1 (básico - Review Collector) | 1 | Perfil, responder reviews, notificações |
| **Starter** | ~$99/mês | 100 | 2 | 1 | Templates personalizados, 15 integrações |
| **Plus** | ~$319/mês | 300 | 10 | 3 | Analytics avançados, 25 integrações |
| **Premium** | ~$799/mês | 1.000 | 21 | Ilimitados | Sentiment analysis, dashboards avançados |
| **Enterprise** | Sob consulta | Ilimitados | Todos | Ilimitados | API completa, account manager dedicado |

### Notas sobre preços:
- Valores em **USD**
- O plano **Starter** é restrito a empresas com faturamento < $5M/ano
- Pagamento mensal (quando disponível) tem acréscimo de ~20%
- **API de acesso completo** só está disponível nos planos **Premium** e **Enterprise**

---

## 4. O que é possível no Plano Gratuito

### ✅ Incluso:
- Reivindicar e personalizar perfil (logo, descrição, contato)
- Receber avaliações orgânicas (clientes encontram você no Trustpilot)
- Enviar até **50 convites de avaliação** por mês
- Responder a todas as avaliações publicamente
- Receber notificações por email de novas avaliações
- **1 widget básico** (Review Collector — botão que redireciona para o Trustpilot)

### ❌ NÃO incluso:
- **Widgets TrustBox avançados** (estrelas, carousel de reviews, grid de reviews)
- Exibir nota/estrelas diretamente no seu site
- Analytics e relatórios avançados
- Personalização de marca (remover branding do Trustpilot)
- Acesso à API
- Templates de email customizados

### ⚡ Resumo prático:
> No plano gratuito, você pode **coletar avaliações** e ter um perfil público no Trustpilot, mas **NÃO pode exibir estrelas/reviews bonitos no seu site**. O único widget disponível é um botão simples que leva o usuário ao Trustpilot.

---

## 5. Métodos de Integração

### 5.1. Widget TrustBox (Recomendado para o site)

O método principal. O Trustpilot fornece um trecho de código (script + HTML) que renderiza um widget no seu site.

**Funcionamento técnico:**
1. Um script JS é carregado: `widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js`
2. O script procura divs com a classe `trustpilot-widget`
3. Renderiza o widget dentro dessas divs como um **iframe**

**Tipos de widgets disponíveis (pagos):**
- **Mini** — Estrelas + nota compactas
- **Micro Review Count** — Estrelas + número de reviews
- **Micro Star** — Só as estrelas
- **Carousel** — Carrossel de reviews
- **Grid** — Grade com múltiplas reviews
- **Review Collector** — Botão para coletar reviews (único gratuito)

### 5.2. API Trustpilot (Avançado)

Para quem quer controle total sobre como as reviews são exibidas.

**Autenticação:**
- APIs Públicas: Apenas API Key (Client ID) no header `apikey:{key}`
- APIs Privadas: OAuth 2.0 com `client_credentials` ou `authorization_code`
- Token endpoint: `https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken`
- Tokens expiram em ~100 horas

**Endpoints principais:**
```
GET /v1/business-units/find?name=flautasboost.com.br     → Encontrar Business Unit ID
GET /v1/business-units/{id}                               → Info do perfil
GET /v1/business-units/{id}/reviews                       → Reviews públicas
GET /v1/private/business-units/{id}/reviews               → Reviews privadas (OAuth)
```

> ⚠️ **API só disponível nos planos Premium/Enterprise**

### 5.3. Link direto + Componente customizado

Alternativa gratuita: criar um componente React customizado que exibe avaliações coletadas manualmente ou via link direto para o perfil do Trustpilot.

---

## 6. Recomendação para o FlautasBoost

### 🎯 O que vamos implementar (100% gratuito):

- Badge "Avalie-nos no Trustpilot" no **footer** do site
- Botão/link de avaliação na **página pós-compra** (incentiva o cliente a avaliar após finalizar pedido)
- Componente **TrustpilotWidget** preparado para widget oficial (funciona quando tiver Business Unit ID)
- Link direto para o perfil do Trustpilot no footer
- Variáveis de ambiente com placeholders prontos para preencher

> 💡 **Nota sobre planos pagos**: No futuro, caso queira widgets visuais (estrelas, carousel de reviews) ou API, basta contratar um plano pago e os componentes já estarão prontos para usar.

---

## 7. Plano Técnico de Implementação

### 7.1. Arquivos a criar/modificar

```
src/
├── components/
│   └── trustpilot/
│       ├── trustpilot-widget.tsx        [NOVO] — Componente wrapper do TrustBox (preparado para futuro)
│       ├── trustpilot-badge.tsx         [NOVO] — Badge "Avalie-nos no Trustpilot"
│       └── trustpilot-review-link.tsx   [NOVO] — Botão para página de avaliação pós-compra
├── lib/
│   └── trustpilot.ts                   [NOVO] — Configurações e helpers

Componentes existentes a modificar:
├── components/layout/
│   └── footer.tsx                       [MODIFICAR] — Adicionar badge Trustpilot

Configs:
├── .env.local                           [MODIFICAR] — Adicionar variáveis Trustpilot
└── .env.example                         [MODIFICAR] — Documentar variáveis
```

### 7.2. Componente TrustBox Widget (Next.js)

Componente principal para renderizar widgets do Trustpilot no Next.js:

```tsx
// src/components/trustpilot/trustpilot-widget.tsx
"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

// Declarar tipo global do Trustpilot no window
declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement | null, force?: boolean) => void;
    };
  }
}

interface TrustpilotWidgetProps {
  templateId: string;      // ID do template do widget (obtido no dashboard)
  businessUnitId: string;  // ID da business unit (obtido no dashboard)
  locale?: string;
  height?: string;
  width?: string;
  theme?: "light" | "dark";
  className?: string;
}

export function TrustpilotWidget({
  templateId,
  businessUnitId,
  locale = "pt-BR",
  height = "52px",
  width = "100%",
  theme = "dark",
  className = "",
}: TrustpilotWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Quando o componente montar, forçar carregamento do widget
    if (window.Trustpilot && widgetRef.current) {
      window.Trustpilot.loadFromElement(widgetRef.current, true);
    }
  }, []);

  return (
    <>
      <Script
        src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="afterInteractive"
      />
      <div
        ref={widgetRef}
        className={`trustpilot-widget ${className}`}
        data-locale={locale}
        data-template-id={templateId}
        data-businessunit-id={businessUnitId}
        data-style-height={height}
        data-style-width={width}
        data-theme={theme}
      >
        <a
          href={`https://www.trustpilot.com/review/flautasboost.com.br`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Trustpilot
        </a>
      </div>
    </>
  );
}
```

### 7.3. Componente Badge (Gratuito — Fase 1)

```tsx
// src/components/trustpilot/trustpilot-badge.tsx
"use client";

import Link from "next/link";

interface TrustpilotBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function TrustpilotBadge({ className = "", size = "md" }: TrustpilotBadgeProps) {
  const sizeClasses = {
    sm: "text-xs gap-1.5",
    md: "text-sm gap-2",
    lg: "text-base gap-2.5",
  };

  return (
    <a
      href="https://www.trustpilot.com/review/flautasboost.com.br"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center ${sizeClasses[size]} 
        text-muted-foreground hover:text-brand-purple transition-colors ${className}`}
    >
      {/* Ícone Trustpilot (estrela verde) */}
      <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-5 md:w-5" fill="#00B67A">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
      <span>Avalie-nos no Trustpilot</span>
    </a>
  );
}
```

### 7.4. Link de avaliação pós-compra

```tsx
// src/components/trustpilot/trustpilot-review-link.tsx
"use client";

import { Button } from "@/components/ui/button";
import { StarIcon } from "lucide-react";

interface TrustpilotReviewLinkProps {
  className?: string;
}

export function TrustpilotReviewLink({ className = "" }: TrustpilotReviewLinkProps) {
  const reviewUrl = "https://www.trustpilot.com/evaluate/flautasboost.com.br";

  return (
    <Button
      asChild
      variant="outline"
      className={`border-brand-purple/50 hover:bg-brand-purple/10 ${className}`}
    >
      <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
        <StarIcon className="h-4 w-4 mr-2 text-[#00B67A]" />
        Deixe sua avaliação no Trustpilot
      </a>
    </Button>
  );
}
```

### 7.5. Integração no Footer (footer.tsx)

Adicionar na seção "Suporte" do footer, após os links existentes:

```tsx
{/* Trustpilot Badge */}
<li>
  <TrustpilotBadge size="sm" />
</li>
```

### 7.6. Integração pós-compra

Adicionar o componente `TrustpilotReviewLink` na página de confirmação de pagamento, incentivando o cliente a avaliar após a compra.

### 7.7. Schema.org para SEO (page.tsx)

Adicionar structured data de AggregateRating na home:

```tsx
const aggregateRatingSchema = {
  '@context': 'https://schema.org',
  '@type': 'AggregateRating',
  itemReviewed: {
    '@type': 'Organization',
    name: 'FlautasBoost',
    url: siteUrl,
  },
  ratingValue: '4.8',  // Atualizar com valor real
  bestRating: '5',
  worstRating: '1',
  ratingCount: '127',  // Atualizar com valor real
};
```

> ⚠️ Os valores de `ratingValue` e `ratingCount` devem ser atualizados manualmente ou via API (plano pago) para refletir dados reais.

---

## 8. Variáveis de Ambiente

Adicionar ao `.env.local` e `.env.example`:

```env
# ===== Trustpilot =====
# Business Unit ID (encontrado em: business.trustpilot.com > Settings > Business Information)
NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID=

# Template ID do widget (encontrado ao gerar código do widget no dashboard)
NEXT_PUBLIC_TRUSTPILOT_TEMPLATE_ID=

# URL do perfil público
NEXT_PUBLIC_TRUSTPILOT_PROFILE_URL=https://www.trustpilot.com/review/flautasboost.com.br

# API Key (apenas para planos pagos com acesso à API)
# TRUSTPILOT_API_KEY=
# TRUSTPILOT_API_SECRET=
```

> **Nota**: Variáveis `NEXT_PUBLIC_*` são expostas no client-side. Nunca colocar API Secret como `NEXT_PUBLIC_`.

---

## 9. Considerações de SEO

### Benefícios:
- **Rich Snippets**: Estrelas aparecem nos resultados do Google quando há structured data válido
- **Autoridade**: Backlink do perfil Trustpilot → flautasboost.com.br
- **Trust Signals**: Avaliações positivas aumentam CTR nos resultados de busca

### Limitações:
- Widgets TrustBox são renderizados **client-side** (iframe), portanto NÃO são indexados pelo Google
- Para SEO real, é necessário usar a **API** para buscar dados server-side e renderizar como HTML estático
- O Schema.org `AggregateRating` deve ter dados **reais e verificáveis** (o Google pode penalizar dados falsos)

### Recomendação SEO:
1. **Fase 1**: Adicionar link nofollow para o perfil Trustpilot + Schema.org manual
2. **Fase 2+**: Usar API para renderizar reviews SSR e structured data dinâmico

---

## 10. Considerações de LGPD/GDPR

- Os widgets do Trustpilot carregam **scripts de terceiros** e podem definir **cookies**
- É necessário garantir que o **banner de consentimento de cookies** cubra o Trustpilot
- Recomendação: carregar o script do Trustpilot **apenas após consentimento** do usuário
- A política de privacidade deve mencionar o Trustpilot como processador de dados terceirizado

---

## 11. Checklist — O que VOCÊ precisa fazer (após a implementação técnica)

> ⚡ **Abordagem**: Toda a parte técnica (código, componentes, .env) será implementada primeiro com placeholders. Você cria a conta no Trustpilot **depois** e só preenche o Business Unit ID no `.env.local`.

### Passo a passo (na ordem):

- [ ] **1. Criar conta business** em [business.trustpilot.com](https://business.trustpilot.com)
- [ ] **2. Reivindicar o domínio** `flautasboost.com.br` (verificação por email ou DNS)
- [ ] **3. Personalizar o perfil** (logo, descrição, categoria, contato)
- [ ] **4. Copiar o Business Unit ID** (em Settings > Business Information)
- [ ] **5. Colar o ID no `.env.local`** na variável `NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID`
- [ ] **6. Se plano pago (futuro)**: Obter Template ID do widget e preencher `NEXT_PUBLIC_TRUSTPILOT_TEMPLATE_ID`
- [ ] **7. Testar** — o badge e link de avaliação já funcionam sem ID. O widget TrustBox só aparece com ID válido
- [ ] **8. Começar a convidar clientes** a avaliar (enviar link direto pós-compra)

---

## 12. Cronograma

| Tarefa | Quem faz | Estimativa |
|:-------|:---------|:-----------|
| Criar componentes `trustpilot-badge`, `trustpilot-review-link`, `trustpilot-widget` | 🤖 Agente | 1h |
| Criar `lib/trustpilot.ts` com config e helpers | 🤖 Agente | 15 min |
| Integrar badge no footer | 🤖 Agente | 30 min |
| Adicionar link de avaliação na página pós-compra | 🤖 Agente | 1h |
| Adicionar variáveis de ambiente (.env.local / .env.example) | 🤖 Agente | 15 min |
| Testes e ajustes visuais | 🤖 Agente | 1h |
| Criar conta no Trustpilot + reivindicar perfil | 👤 Você | 30 min |
| Preencher Business Unit ID no `.env.local` | 👤 Você | 2 min |
| **Total** | | **~4.5 horas** |

---

## 📎 Links Úteis

- [Trustpilot Business Dashboard](https://business.trustpilot.com)
- [Trustpilot API Documentation](https://developers.trustpilot.com)
- [Trustpilot Pricing](https://business.trustpilot.com/plans)
- [TrustBox Widget Library](https://business.trustpilot.com/trustbox)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)

---

> 💡 **Abordagem definida**: Toda a implementação técnica será feita primeiro, com Business Unit ID como placeholder no `.env.local`. Depois, você cria a conta no Trustpilot, copia o ID e cola no `.env.local`. Pronto — tudo funciona automaticamente.
