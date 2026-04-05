# Client Retention System — Design Spec
**Data:** 2026-04-05  
**Status:** Aprovado para implementação  
**Escopo:** Retenção de clientes via progressão visual, streak de descontos e comunicação automática  

---

## 1. Objetivo

Transformar o comportamento pós-compra do cliente. Hoje: pedido concluído → silêncio → churn.  
Depois: pedido concluído → pico de satisfação capturado → recompra natural.

O cliente do GameBoost já quer continuar subindo de rating — o sistema só precisa capturar esse desejo no momento certo e criar incentivo financeiro para não parar.

---

## 2. Mecânicas

### 2.1 Barra de Progressão (Dashboard do Cliente)

Exibida na página `/dashboard` do cliente após ter pelo menos 1 pedido concluído.

**Componente principal — barra de progresso:**
- Rating atual (do último pedido concluído, campo `targetRating` ou `targetRank`)
- Próximo marco pré-calculado (ver tabela abaixo)
- Percentual de progresso entre o rating inicial do último boost e o próximo marco
- CTA "Contratar agora" com desconto ativo e countdown de 48h (se houver desconto disponível)

**Marcos de rating Premier (CS2):**
| Faixa atual | Próximo marco |
|---|---|
| 0 – 4.999 | 5.000 |
| 5.000 – 9.999 | 10.000 |
| 10.000 – 14.999 | 15.000 |
| 15.000 – 19.999 | 20.000 |
| 20.000 – 25.999 | 26.000 (máximo) |

**Marcos de nível Gamers Club:**
| Nível atual | Próximo marco |
|---|---|
| 1–5 | 6 |
| 6–10 | 11 |
| 11–15 | 16 |
| 16–19 | 20 (máximo) |

**Componente secundário — linha do tempo:**
- Lista cronológica de todos os pedidos concluídos do cliente
- Exibe: rating/nível atingido + data do boost
- Último item é "Próximo" (desbloqueado quando CTA é clicado)

**Regras:**
- Só exibe se o cliente tem ≥ 1 pedido com status `COMPLETED`
- Se o cliente já está no rating máximo do modo, exibe mensagem de conquista e CTA para outro modo de jogo
- Só exibe pedidos do mesmo `gameMode` na linha do tempo (Premier separado de Gamers Club)

---

### 2.2 Streak de Fidelidade

**Definição de streak:** número de pedidos concluídos consecutivos com intervalo ≤ 30 dias entre cada um.

**Tabela de descontos:**
| Pedido | Desconto |
|---|---|
| 1º | 0% |
| 2º | 5% |
| 3º | 10% |
| 4º ou mais | 15% (teto) |

**Regras:**
- O desconto é aplicado no momento da criação do pedido, reduzindo o campo `total`
- O campo `discountPct` no `Order` registra qual desconto foi aplicado
- O streak **reseta** se o cliente ficar > 30 dias sem concluir um pedido
- O desconto **sai inteiramente do lucro da plataforma** — booster recebe comissão sobre o valor original, não o valor com desconto
- O streak é por cliente (não por `gameMode`)
- O desconto máximo é 15% independente de quantos pedidos consecutivos o cliente fizer

**Campos novos no modelo `User`:**
```
completedOrdersStreak  Int     @default(0)
streakLastOrderAt      DateTime?
currentDiscountPct     Float   @default(0)
```

**Campos novos no modelo `Order`:**
```
discountApplied  Boolean @default(false)
discountPct      Float   @default(0)
```

**Lógica de atualização do streak** (executada no webhook de pagamento, quando `status → COMPLETED`):
1. Buscar `streakLastOrderAt` do usuário
2. Se `streakLastOrderAt` é null ou > 30 dias atrás → resetar streak para 1
3. Caso contrário → incrementar streak
4. Calcular novo `currentDiscountPct` pela tabela acima
5. Atualizar `streakLastOrderAt = now()`
6. Disparar notificação `STREAK_UNLOCK` se o desconto subiu de nível

---

### 2.3 Notificação In-App (imediata)

Disparada imediatamente quando o pedido muda para `COMPLETED`.

**Tipo:** `ORDER_UPDATE` (usar sistema de notificação existente)  
**Título:** `"Boost concluído! Você chegou a {targetRating} pts"`  
**Corpo:** `"Seus rivais não param. Garanta {desconto}% off no próximo boost — oferta válida por 48h."`  
**Link:** `/dashboard` (abre com a barra de progressão em foco)

Se o cliente não tiver desconto de streak ativo ainda:  
**Corpo:** `"Continue subindo — contrate o próximo boost e ganhe 5% de desconto."`

---

### 2.4 Email de Conclusão (2 minutos após conclusão)

Disparado via função de email existente (`sendOrderCompletedEmail`) — expandir o template.

**Conteúdo adicional ao template atual:**
- Barra de progresso mini (rating atual → próximo marco)
- Desconto disponível (se houver streak) com validade de 48h
- CTA: "Garantir meu desconto agora" → `/dashboard`

---

### 2.5 Email de Reativação (14 dias sem nova compra)

Disparado se o cliente não criou nenhum pedido nos últimos 14 dias após o último `COMPLETED`.

**Tom:** competitivo + oportunidade + FOMO.

**Assunto:** `"Seus rivais estão subindo. Você parou em {rating}."`

**Conteúdo:**
- Frase de abertura competitiva: "Você parou em X pts há 14 dias."
- Dado concreto: "Faltam só Y pts para {próximo marco}."
- Oferta: desconto do streak atual (ou 5% se streak zerou) com countdown de 48h
- CTA: "Garantir meu desconto agora"

**Regras:**
- Só dispara 1 vez por período de inatividade (não reenvia toda semana)
- Não dispara se o cliente já criou um novo pedido no período
- Não dispara se o cliente optou por sair de emails de marketing (sem campo hoje — implementar `emailMarketing Boolean @default(true)` no `User`)
- O desconto oferecido no email é gerado como um cupom de uso único com 48h de expiração, armazenado no `User.reactivationDiscountExpiresAt` e `User.reactivationDiscountPct`

**Implementação do trigger:**
- Cron job diário (adicionar à rota `/api/cron/reactivation`) que busca clientes com `streakLastOrderAt` entre 14 e 15 dias atrás que não criaram pedido novo
- Protegido por `CRON_SECRET` como os demais crons

---

## 3. Campos adicionados ao banco de dados

### `User`
```prisma
completedOrdersStreak      Int       @default(0)
streakLastOrderAt          DateTime?
currentDiscountPct         Float     @default(0)
emailMarketing             Boolean   @default(true)
reactivationDiscountPct    Float     @default(0)
reactivationDiscountExpiresAt DateTime?
```

### `Order`
```prisma
discountApplied  Boolean @default(false)
discountPct      Float   @default(0)
```

---

## 4. Fluxo completo

```
Pedido → COMPLETED
  ├── Atualizar streak do User
  ├── Enviar Notification in-app (imediato)
  ├── Enviar email de conclusão expandido (+2 min)
  └── Agendar verificação de reativação (+14 dias via cron)

Criação de novo Order
  └── Aplicar currentDiscountPct ou reactivationDiscountPct (o maior)
      └── Registrar discountPct e discountApplied no Order
```

---

## 5. O que NÃO está no escopo desta implementação

- Sistema de tiers (Bronze/Prata/Ouro/Diamante) — Opção C, fase futura
- Pontos/XP resgatáveis — Opção C, fase futura
- Ranking público de clientes — fase futura
- Missões semanais — fase futura
- Engajamento de boosters — spec separado

---

## 6. Critérios de sucesso

- Taxa de recompra em 30 dias ↑ (baseline: medir antes de lançar)
- Abertura de email de reativação > 30%
- Clique no CTA da notificação in-app > 20%
- Streak médio dos clientes recorrentes ≥ 2 pedidos
