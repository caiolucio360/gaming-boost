# 🔍 Diagnóstico de Webhook - Pagamento não atualizado

## URL do seu app: https://gaming-boost.vercel.app

## ✅ Passos para Diagnosticar:

### 1. Verificar Status do Pagamento no Banco

Use o endpoint de debug que acabei de criar:

```
GET https://gaming-boost.vercel.app/api/webhooks/abacatepay/debug?providerId=SEU_PROVIDER_ID
```

Ou se você tiver o orderId:

```
GET https://gaming-boost.vercel.app/api/webhooks/abacatepay/debug?orderId=SEU_ORDER_ID
```

Isso vai mostrar:
- Status atual do pagamento
- Se `paidAt` está preenchido
- Status do pedido
- Notificações criadas
- Diagnóstico completo

### 2. Verificar Configuração no AbacatePay

**URL do Webhook que deve estar configurada:**
```
https://gaming-boost.vercel.app/api/webhooks/abacatepay
```

**Verifique no painel do AbacatePay:**
- [ ] URL do webhook está correta
- [ ] Webhook está ativo/habilitado
- [ ] Eventos habilitados: `billing.paid`, `billing.expired`, `billing.cancelled`, `billing.refunded`
- [ ] Verificar logs de tentativas de entrega do webhook no painel

### 3. Verificar Logs do Vercel

Acesse o dashboard do Vercel e verifique os logs:
- Procure por "WEBHOOK RECEIVED" - indica que o webhook foi recebido
- Procure por "Payment not found" - indica que o providerId não foi encontrado
- Procure por "Webhook Error" - indica algum erro no processamento

### 4. Possíveis Problemas e Soluções

#### Problema 1: Webhook não está configurado no AbacatePay
**Sintoma:** Nenhum log de webhook recebido
**Solução:** Configure a URL no painel do AbacatePay

#### Problema 2: ProviderId não corresponde
**Sintoma:** Log mostra "Payment not found for providerId: xxx"
**Solução:** 
- Verificar se o `providerId` salvo no banco corresponde ao `data.id` do webhook
- Verificar se o pagamento foi criado corretamente

#### Problema 3: Formato do evento diferente
**Sintoma:** Log mostra "Webhook received but no actionable data"
**Solução:** 
- Verificar o formato exato do evento que o AbacatePay está enviando
- O código verifica `body.event`, `body.type` e `data.status`

#### Problema 4: Validação de assinatura falhando
**Sintoma:** Log mostra "Invalid webhook signature"
**Solução:**
- Verificar se `ABACATEPAY_WEBHOOK_SECRET` está configurado corretamente
- Ou remover a validação temporariamente para testar

### 5. Testar Webhook Manualmente

Você pode testar o webhook manualmente fazendo uma requisição POST:

```bash
curl -X POST https://gaming-boost.vercel.app/api/webhooks/abacatepay \
  -H "Content-Type: application/json" \
  -d '{
    "event": "billing.paid",
    "data": {
      "id": "SEU_PROVIDER_ID_AQUI",
      "status": "PAID"
    }
  }'
```

Substitua `SEU_PROVIDER_ID_AQUI` pelo `providerId` do seu pagamento.

### 6. Verificar no Banco de Dados

Execute esta query para ver o status atual:

```sql
SELECT 
  p.id,
  p."providerId",
  p.status,
  p."paidAt",
  p."updatedAt",
  o.id as order_id,
  o.status as order_status
FROM "Payment" p
JOIN "Order" o ON o.id = p."orderId"
ORDER BY p."createdAt" DESC
LIMIT 5;
```

## 📋 Checklist Rápido:

- [ ] Webhook configurado no AbacatePay com URL correta
- [ ] Variável `NEXT_PUBLIC_APP_URL` configurada no Vercel
- [ ] Logs do Vercel mostram tentativas de webhook
- [ ] `providerId` no banco corresponde ao `data.id` do webhook
- [ ] Endpoint de debug mostra status correto do pagamento

## 🚨 Próximos Passos:

1. **Acesse o endpoint de debug** para ver o status atual
2. **Verifique os logs do Vercel** para ver se o webhook foi recebido
3. **Verifique o painel do AbacatePay** para ver tentativas de entrega
4. **Compare o providerId** do banco com o que o AbacatePay está enviando

