# Design: Alert Standardization + Chat Fixes

**Data:** 2026-04-09  
**Status:** Aprovado

---

## Contexto

O sistema usa dois mecanismos de feedback ao usuário:

1. **Sonner toasts** (`showError`, `showSuccess`, etc.) — notificações flutuantes transitórias após ações do usuário. Correto e permanece.
2. **`Alert` do shadcn/ui** — mensagens inline persistentes (erros de formulário, erros de fetch). Parcialmente implementado, com inconsistências de estilo.

O componente `OrderChat` tem dois bugs: scroll da página ativado ao tentar rolar o chat internamente, e ausência de opção de expandir.

---

## Parte 1: Padronização de Alerts

### Regra clara

| Tipo de feedback | Mecanismo | Motivo |
|---|---|---|
| Após ação do usuário (salvar, enviar, aprovar) | Toast Sonner | Transitório, não bloqueia fluxo |
| Erro de carregamento de dados (fetch) | `Alert` inline | Persistente, visível no contexto |
| Erro de formulário (state inválido) | `Alert` inline | Persistente, próximo ao form |
| Erro sem token / link inválido | Card dedicado (já existente) | Estado de página inteira |
| Validação de campo específico | `FormMessage` (react-hook-form) | Granular, por campo |

### Estado atual vs. necessário

**Páginas de auth** — já usam `Alert` corretamente ✓  
**`/admin` (dashboard)** — já usa `Alert` para erro de fetch ✓  
**`/admin/pricing`** — usa `Alert` mas com `text-red-200`/`text-red-300` no interior → padronizar cores internas  

### Padrão de estilo unificado

```tsx
// Erro
<Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle className="font-orbitron">Título do erro</AlertTitle>
  <AlertDescription className="font-rajdhani">Mensagem detalhada.</AlertDescription>
</Alert>

// Sucesso
<Alert className="bg-green-500/10 border-green-500/50 text-green-300">
  <CheckCircle2 className="h-4 w-4 text-green-400" />
  <AlertTitle className="font-orbitron text-green-300">Título</AlertTitle>
  <AlertDescription className="font-rajdhani text-green-400">Mensagem.</AlertDescription>
</Alert>

// Aviso
<Alert className="bg-yellow-500/10 border-yellow-500/50 text-yellow-300">
  <AlertTriangle className="h-4 w-4 text-yellow-400" />
  <AlertTitle className="font-orbitron text-yellow-300">Aviso</AlertTitle>
  <AlertDescription className="font-rajdhani text-yellow-400">Mensagem.</AlertDescription>
</Alert>
```

### Arquivos a modificar

1. `src/app/admin/pricing/page.tsx` — corrigir `text-red-200`/`text-red-300` dentro do Alert existente para usar as cores do padrão acima.

> **Nota:** As demais páginas já estão corretas ou usam toasts apropriadamente. Nenhuma outra página tem inline Alert com problema de estilo relevante.

---

## Parte 2: Chat — Fix de Scroll + Modal de Expansão

### Bug: scroll da página ao rolar o chat

**Causa raiz:** `messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })` na linha 205 do `order-chat.tsx`. O `scrollIntoView` escala pelo DOM até encontrar um ancestral scrollável — que pode ser a janela inteira, puxando a página junto.

**Correção:** Substituir `scrollIntoView` por scroll direto no elemento da `ScrollArea`. Usar um `ref` no container da `ScrollArea` e chamar `container.scrollTop = container.scrollHeight` dentro do componente, isolado.

### Funcionalidade: botão Expandir → Dialog

**Fluxo:**
- No header do chat há um ícone `Maximize2`
- Ao clicar, abre um `Dialog` do shadcn/ui com o chat em `h-[80vh]`
- O chat dentro do modal recebe as mesmas props (`orderId`, `onMessagesUpdate`)
- O estado do chat (mensagens, polling) é compartilhado via re-fetch — sem prop drilling adicional
- O Dialog tem um botão `Minimize2` no header para fechar

**Estrutura do Dialog:**
```
Dialog
└── DialogContent (max-w-3xl, h-[85vh], flex flex-col)
    ├── DialogHeader (flex-shrink-0)
    │   ├── Título + ícone chat
    │   └── Botão fechar (DialogClose)
    └── OrderChat (expanded=true, flex-1, overflow-hidden)
```

**Prop `expanded`:** O componente `OrderChat` recebe prop opcional `expanded?: boolean`. Quando `true`, remove a altura fixa (`h-[500px]`) e usa `h-full` para preencher o container pai.

### Arquivos a modificar

1. `src/components/order/order-chat.tsx`
   - Adicionar prop `expanded?: boolean`
   - Adicionar `ref` no `ScrollArea` para scroll interno
   - Substituir `scrollIntoView` por scroll no ref do ScrollArea
   - Adicionar botão `Maximize2` no header
   - Adicionar `Dialog` controlado por `useState<boolean>`
   - Renderizar `OrderChat` dentro do Dialog com `expanded={true}`

---

## Fora do escopo

- Refactor do sistema de toasts (Sonner permanece)
- Persistência do estado de "expandido" entre sessões
- Chat em tempo real via WebSocket (polling permanece)
- Mudanças em badge de status ou cores de valores monetários (não são mensagens de feedback)

---

## Critérios de conclusão

- [ ] `/admin/pricing`: cores internas do Alert padronizadas
- [ ] Chat: rolar mensagens não move a página
- [ ] Chat: botão Maximize2 no header abre Dialog
- [ ] Chat dentro do Dialog preenche a altura do modal
- [ ] Botão fechar no Dialog funciona
- [ ] Nenhum toast substituído por Alert
