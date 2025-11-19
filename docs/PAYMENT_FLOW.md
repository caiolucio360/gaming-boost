# Fluxo de Pagamentos - GameBoost Pro

Este documento descreve o fluxo completo de pagamentos do sistema, desde o pagamento do cliente até a liberação para boosters e administradores.

## 📋 Visão Geral

O sistema implementa um modelo de **custódia (escrow)** onde:
- O cliente paga quando cria o pedido
- O dinheiro fica "em custódia" até o pedido ser concluído
- Boosters e admins só recebem quando o pedido é concluído **E** o pagamento foi confirmado

## 🔄 Fluxo Completo

### 1. Criação do Pedido e Pagamento

```
Cliente cria pedido → Order criado (status: PENDING)
                  ↓
Cliente gera código PIX → Payment criado (status: PENDING)
                  ↓
Cliente paga via PIX → Payment.status = PAID (confirmado manualmente ou via webhook)
```

**Status neste momento:**
- `Order.status`: `PENDING`
- `Payment.status`: `PAID` (cliente já pagou)
- `BoosterCommission`: Ainda não existe (pedido não foi aceito)
- `AdminRevenue`: Criado com `status: PENDING`

### 2. Aceitação do Pedido pelo Booster

```
Booster aceita pedido → Order.status = IN_PROGRESS
                     ↓
                  BoosterCommission criado (status: PENDING)
```

**Status neste momento:**
- `Order.status`: `IN_PROGRESS`
- `Payment.status`: `PAID` (cliente já pagou)
- `BoosterCommission.status`: `PENDING` (aguardando conclusão)
- `AdminRevenue.status`: `PENDING` (aguardando conclusão)

### 3. Conclusão do Pedido (PAGAMENTO AUTOMÁTICO)

```
Booster marca pedido como concluído → Order.status = COMPLETED
                                    ↓
Sistema libera AUTOMATICAMENTE as comissões/receitas:
  - BoosterCommission.status = PAID ✅
  - AdminRevenue.status = PAID ✅
```

**Processo Automático:**
- ✅ Quando o pedido é marcado como `COMPLETED`, o sistema **automaticamente** libera as comissões
- ✅ Não é necessário verificar o pagamento do cliente
- ✅ As comissões são liberadas imediatamente quando o serviço é concluído
- ✅ Tanto o booster quanto o admin recebem automaticamente seus valores

## 📊 Estados dos Pagamentos

### Payment (Pagamento do Cliente)

| Status | Descrição |
|--------|-----------|
| `PENDING` | Código PIX gerado, aguardando pagamento |
| `PAID` | Pagamento confirmado (cliente pagou) |
| `EXPIRED` | Código PIX expirado |
| `CANCELLED` | Pagamento cancelado |

### BoosterCommission / AdminRevenue

| Status | Descrição |
|--------|-----------|
| `PENDING` | Aguardando conclusão do pedido E confirmação de pagamento |
| `PAID` | Disponível para saque (pedido concluído E pagamento confirmado) |
| `CANCELLED` | Cancelado (pedido cancelado) |

## 🔐 Regras de Negócio

### 1. Liberação Automática de Comissões/Receitas

**Condição necessária para liberar:**
- ✅ `Order.status === 'COMPLETED'`

**Processo Automático:**
- Quando o pedido é marcado como `COMPLETED`, o sistema **automaticamente** libera as comissões
- Não é necessário verificar o pagamento do cliente
- As comissões são liberadas imediatamente

### 2. Processo Automático de Pagamento

**Quando o booster marca pedido como concluído:**
```typescript
if (status === 'COMPLETED') {
  // Liberar automaticamente comissão do booster
  await prisma.boosterCommission.updateMany({
    where: { orderId, status: 'PENDING' },
    data: { status: 'PAID', paidAt: new Date() },
  })

  // Liberar automaticamente receita do admin
  await prisma.adminRevenue.updateMany({
    where: { orderId, status: 'PENDING' },
    data: { status: 'PAID', paidAt: new Date() },
  })
}
```

**Resultado:**
- ✅ Comissões liberadas automaticamente
- ✅ Não requer confirmação manual
- ✅ Processo instantâneo quando o serviço é concluído

## 💡 Cenários

### Cenário 1: Fluxo Normal

1. Cliente cria pedido → `Order.status = PENDING`
2. Cliente paga → `Payment.status = PAID`
3. Booster aceita → `Order.status = IN_PROGRESS`, `BoosterCommission.status = PENDING`
4. Booster conclui → `Order.status = COMPLETED`
5. Sistema libera automaticamente → `BoosterCommission.status = PAID`, `AdminRevenue.status = PAID` ✅

**Resultado:** ✅ Dinheiro liberado automaticamente quando o serviço é concluído

### Cenário 2: Conclusão pelo Admin

1. Cliente cria pedido → `Order.status = PENDING`
2. Cliente paga → `Payment.status = PAID`
3. Booster aceita → `Order.status = IN_PROGRESS`
4. Admin marca como concluído → `Order.status = COMPLETED`
5. Sistema libera automaticamente → `BoosterCommission.status = PAID`, `AdminRevenue.status = PAID` ✅

**Resultado:** ✅ Dinheiro liberado automaticamente, independente de quem marca como concluído

### Cenário 3: Pedido Cancelado

1. Cliente cria pedido → `Order.status = PENDING`
2. Cliente paga → `Payment.status = PAID`
3. Cliente cancela → `Order.status = CANCELLED`
4. Sistema cancela → `BoosterCommission.status = CANCELLED` (se existir), `AdminRevenue.status = CANCELLED`

**Resultado:** ✅ Comissões/receitas canceladas, reembolso do cliente (se aplicável)

## 🔧 Implementação Técnica

### Liberação Automática na Conclusão do Pedido

```typescript
// src/app/api/booster/orders/[id]/route.ts
// src/app/api/admin/orders/[id]/route.ts
if (status === 'COMPLETED') {
  // Liberar automaticamente comissão do booster
  await prisma.boosterCommission.updateMany({
    where: { orderId, status: 'PENDING' },
    data: { status: 'PAID', paidAt: new Date() },
  })
  
  // Liberar automaticamente receita do admin
  await prisma.adminRevenue.updateMany({
    where: { orderId, status: 'PENDING' },
    data: { status: 'PAID', paidAt: new Date() },
  })
}
```

**Características:**
- ✅ Processo totalmente automático
- ✅ Não requer verificação de pagamento
- ✅ Funciona tanto quando o booster quanto o admin marca como concluído
- ✅ Liberação instantânea quando o status muda para `COMPLETED`

## 📈 Melhorias Futuras

### 1. Webhook de Pagamento

Integrar com gateway de pagamento (ex: Mercado Pago, PagSeguro) para confirmação automática:

```typescript
// Webhook recebe confirmação de pagamento
POST /api/webhooks/payment
  → Atualiza Payment.status = PAID
  → Se Order.status = COMPLETED, libera comissões/receitas automaticamente
```

### 2. Sistema de Saque

Criar sistema para boosters/admins solicitarem saque:

```prisma
model Withdrawal {
  id          Int      @id @default(autoincrement())
  userId      Int
  amount      Float
  pixKey      String
  status      String   // PENDING, PROCESSING, COMPLETED, FAILED
  processedAt DateTime?
  createdAt   DateTime @default(now())
}
```

### 3. Relatórios Financeiros

- Dashboard de receitas/pagamentos
- Relatórios por período
- Exportação para contabilidade

## ✅ Vantagens do Sistema Atual

1. **Segurança**: Dinheiro só é liberado quando o serviço é concluído
2. **Transparência**: Todos os status são rastreáveis
3. **Flexibilidade**: Suporta confirmação manual ou automática
4. **Auditoria**: Histórico completo de pagamentos e liberações

## 🔍 Queries Úteis

### Verificar pagamentos pendentes de liberação

```sql
SELECT o.id, o.status, p.status as payment_status, 
       bc.status as commission_status, ar.status as revenue_status
FROM "Order" o
LEFT JOIN "Payment" p ON p."orderId" = o.id
LEFT JOIN "BoosterCommission" bc ON bc."orderId" = o.id
LEFT JOIN "AdminRevenue" ar ON ar."orderId" = o.id
WHERE o.status = 'COMPLETED'
  AND p.status = 'PAID'
  AND (bc.status = 'PENDING' OR ar.status = 'PENDING')
```

### Total disponível para saque (booster)

```sql
SELECT SUM(amount) as total_available
FROM "BoosterCommission"
WHERE "boosterId" = ? AND status = 'PAID'
```

---

**Última atualização**: 2024  
**Versão**: 1.0

