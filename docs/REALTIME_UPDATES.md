# Atualizações em Tempo Real - GameBoost

Este documento descreve a implementação de atualizações em tempo real usando **Server-Sent Events (SSE)**, uma solução leve e eficiente para notificações unidirecionais.

## 📋 Visão Geral

O sistema implementa atualizações em tempo real para:
- **Pedidos**: Quando um booster aceita um pedido, ele desaparece imediatamente da lista de outros boosters
- **Pagamentos**: Status de pagamento atualizado em tempo real
- **Status de Pedidos**: Mudanças de status propagadas instantaneamente

## 🎯 Por que Server-Sent Events (SSE)?

### Vantagens
- ✅ **Mais leve que WebSockets** - Não precisa de biblioteca externa pesada
- ✅ **Suportado nativamente** - EventSource API do browser
- ✅ **Ideal para unidirecional** - Servidor → Cliente (perfeito para notificações)
- ✅ **Reconexão automática** - Browser reconecta automaticamente
- ✅ **HTTP simples** - Funciona através de proxies e firewalls

### Comparação

| Característica | SSE | WebSockets | Polling |
|----------------|-----|------------|---------|
| Complexidade | Baixa | Alta | Média |
| Overhead | Baixo | Médio | Alto |
| Bidirecional | ❌ | ✅ | ❌ |
| Reconexão | Automática | Manual | Manual |
| Suporte | Nativo | Biblioteca | Nativo |

## 🏗️ Arquitetura

### Fluxo de Dados

```
Cliente (Browser)
    ↓
EventSource('/api/realtime')
    ↓
Rota SSE (/api/realtime)
    ↓
Polling a cada 2s (otimizado)
    ↓
Prisma → PostgreSQL
    ↓
Eventos enviados via SSE
    ↓
Cliente recebe atualizações
```

### Componentes

1. **Rota SSE** (`/api/realtime/route.ts`)
   - Autenticação via token (header ou query string)
   - Polling otimizado a cada 2 segundos
   - Heartbeat a cada 30 segundos
   - Eventos customizados por role

2. **Hook Customizado** (`useRealtime`)
   - Gerencia conexão SSE
   - Reconexão automática
   - Callbacks para eventos

3. **Validação Otimista** (Backend)
   - Transações atômicas com `updateMany`
   - Prevenção de race conditions
   - Validação antes de atualizar

## 🔧 Implementação

### 1. Rota SSE

```typescript
// src/app/api/realtime/route.ts
export async function GET(request: NextRequest) {
  // Autenticação
  // Polling a cada 2s
  // Envio de eventos via SSE
}
```

**Eventos Enviados:**
- `connected` - Confirmação de conexão
- `orders-update` - Atualização de pedidos
- `payment-update` - Atualização de pagamentos
- `admin-update` - Atualizações administrativas
- `heartbeat` - Manter conexão viva
- `error` - Erros

### 2. Hook useRealtime

```typescript
// src/hooks/use-realtime.ts
const { isConnected, lastUpdate } = useRealtime({
  enabled: user?.role === 'BOOSTER',
  onOrderUpdate: (data) => {
    // Atualizar lista de pedidos
  },
})
```

### 3. Integração nas Páginas

```typescript
// src/app/booster/page.tsx
useRealtime({
  enabled: user?.role === 'BOOSTER',
  onOrderUpdate: (data) => {
    if (activeTab === 'available') {
      fetchOrders(true) // Recarregar apenas se necessário
    }
  },
})
```

## 🛡️ Prevenção de Race Conditions

### Problema
Quando múltiplos boosters tentam aceitar o mesmo pedido simultaneamente.

### Solução
Uso de `updateMany` com condições atômicas:

```typescript
const updateResult = await tx.order.updateMany({
  where: {
    id: orderId,
    status: 'PENDING',
    boosterId: null, // Apenas se ainda não tiver booster
  },
  data: {
    boosterId,
    status: 'IN_PROGRESS',
  },
})

// Se count === 0, pedido já foi pego
if (updateResult.count === 0) {
  throw new Error('Pedido já foi atribuído')
}
```

**Vantagens:**
- ✅ Operação atômica no banco
- ✅ Não precisa de locks explícitos
- ✅ Performance otimizada
- ✅ Prevenção garantida de conflitos

## 📊 Eventos por Role

### Booster
- `orders-update`: Contagem de pedidos disponíveis e atribuídos
- Atualização quando pedido é aceito por outro booster

### Cliente
- `orders-update`: Status dos pedidos (PENDING, IN_PROGRESS)
- Atualização quando booster aceita ou conclui pedido

### Admin
- `admin-update`: Pedidos pendentes e pagamentos pendentes
- Atualização de estatísticas gerais

## ⚡ Performance

### Otimizações
- **Polling a cada 2s** - Balanceamento entre latência e carga
- **Queries otimizadas** - Apenas contagens, não dados completos
- **Heartbeat a cada 30s** - Manter conexão sem overhead
- **Reconexão inteligente** - Apenas quando necessário

### Métricas
- **Latência**: ~2 segundos (tempo de polling)
- **Overhead**: Mínimo (apenas contagens)
- **Conexões**: 1 por usuário autenticado
- **Reconexão**: Automática após 3 segundos

## 🔐 Segurança

### Autenticação
- Token JWT via query string (EventSource não suporta headers)
- Validação em cada requisição
- Timeout automático

### Autorização
- Eventos filtrados por role
- Apenas dados relevantes enviados
- Validação no backend

## 📝 Casos de Uso

### 1. Booster Aceita Pedido
```
Booster A aceita pedido → Backend atualiza (atômico)
                      ↓
SSE detecta mudança (2s)
                      ↓
Todos os boosters recebem evento
                      ↓
Lista de disponíveis atualizada
```

### 2. Pagamento Confirmado
```
Admin confirma pagamento → Backend atualiza
                      ↓
SSE detecta mudança
                      ↓
Cliente recebe atualização
                      ↓
Status atualizado na UI
```

### 3. Pedido Concluído
```
Booster marca como concluído → Backend atualiza
                            ↓
SSE detecta mudança
                            ↓
Cliente e Admin recebem atualização
                            ↓
Dashboards atualizados
```

## 🚀 Uso

### Em Componentes

```typescript
import { useRealtime } from '@/hooks/use-realtime'

function MyComponent() {
  useRealtime({
    enabled: true,
    onOrderUpdate: (data) => {
      // Atualizar estado local
      setOrders(data.orders)
    },
    onPaymentUpdate: (data) => {
      // Atualizar pagamentos
      setPayments(data.payments)
    },
  })
}
```

## 🔄 Reconexão Automática

O hook gerencia reconexão automaticamente:
- Erro de conexão → Reconecta após 3 segundos
- Perda de conexão → Reconecta quando possível
- Heartbeat → Mantém conexão viva

## 📈 Melhorias Futuras

1. **Webhooks Externos**
   - Integração com gateways de pagamento
   - Notificações push

2. **Otimização de Polling**
   - Polling adaptativo (mais frequente quando há atividade)
   - Cache de resultados

3. **Eventos Mais Granulares**
   - Eventos específicos por pedido
   - Notificações de mudanças específicas

## ✅ Vantagens da Implementação

1. **Leve** - Sem dependências pesadas
2. **Simples** - Fácil de entender e manter
3. **Eficiente** - Polling otimizado
4. **Confiável** - Reconexão automática
5. **Seguro** - Autenticação e autorização

---

**Última atualização**: Novembro 2024  
**Status**: ✅ Implementado e Funcional

