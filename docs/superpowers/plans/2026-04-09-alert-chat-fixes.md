# Alert Standardization + Chat Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Padronizar cores internas do Alert em `/admin/pricing`, corrigir o bug de scroll da página no chat e adicionar botão de expandir o chat via Dialog.

**Architecture:** Duas mudanças independentes. Task 1 é uma edição cirúrgica de classes CSS. Task 2 refatora `OrderChat` para (a) usar `ref` direto num `div` com `overflow-y-auto` no lugar de `ScrollArea` — eliminando o `scrollIntoView` que causava scroll da página — e (b) extrair o conteúdo do chat em componente interno `ChatContent` para ser reutilizado no Dialog sem duplicar estado ou polling.

**Tech Stack:** Next.js 15, React, shadcn/ui (`Alert`, `Dialog`), Lucide React, Tailwind CSS v4.

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `src/app/admin/pricing/page.tsx` | Modificar: ajustar classes de texto dentro do `AlertDescription` |
| `src/components/order/order-chat.tsx` | Modificar: substituir `ScrollArea` por `div` com ref, remover `scrollIntoView`, extrair `ChatContent`, adicionar Dialog de expansão |

---

## Task 1: Corrigir cores do Alert em `/admin/pricing`

**Arquivo:** `src/app/admin/pricing/page.tsx` — linhas 590–602

- [ ] **Passo 1: Abrir o arquivo e localizar o trecho**

  No arquivo `src/app/admin/pricing/page.tsx`, localizar o bloco (aproximadamente linha 585):

  ```tsx
  {gaps.length > 0 && (
    <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-orbitron">Atenção: Faixas de preço com lacunas</AlertTitle>
      <AlertDescription>
        <p className="mb-2 text-red-200">
          As seguintes faixas não possuem preço configurado e causarão erro no cálculo:
        </p>
        <ul className="list-disc list-inside space-y-1 text-red-300">
          {gaps.map((gap, i) => (
            <li key={i}>
              {selectedMode === 'PREMIER'
                ? `${(gap.start / 1000).toFixed(0)}K - ${(gap.end / 1000).toFixed(0)}K`
                : `Níveis ${gap.start} - ${gap.end}`}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )}
  ```

- [ ] **Passo 2: Substituir as classes de texto inconsistentes**

  Substituir o trecho acima por:

  ```tsx
  {gaps.length > 0 && (
    <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-orbitron">Atenção: Faixas de preço com lacunas</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          As seguintes faixas não possuem preço configurado e causarão erro no cálculo:
        </p>
        <ul className="list-disc list-inside space-y-1">
          {gaps.map((gap, i) => (
            <li key={i}>
              {selectedMode === 'PREMIER'
                ? `${(gap.start / 1000).toFixed(0)}K - ${(gap.end / 1000).toFixed(0)}K`
                : `Níveis ${gap.start} - ${gap.end}`}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )}
  ```

  **Racional:** O `Alert variant="destructive"` já aplica a cor vermelha correta via CSS variables do shadcn/ui. As classes `text-red-200` e `text-red-300` sobrescreviam a cor errada. Removendo-as, o Alert usa sua cor padrão consistente.

- [ ] **Passo 3: Verificar visualmente no navegador**

  Navegar para `/admin/pricing`, criar ou ter uma configuração com lacuna de faixas para acionar o alerta. Verificar que o texto dentro do Alert tem cor vermelha uniforme (não mais duas tonalidades diferentes).

- [ ] **Passo 4: Commit**

  ```bash
  git add src/app/admin/pricing/page.tsx
  git commit -m "fix: padronizar cores de texto dentro do Alert de lacunas de preço"
  ```

---

## Task 2: Corrigir scroll e adicionar expansão no `OrderChat`

**Arquivo:** `src/components/order/order-chat.tsx`

### Contexto do problema

1. **Bug de scroll:** A linha `messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })` escala pelo DOM até o primeiro ancestral scrollável — que pode ser a `window`. Isso puxa a página inteira para baixo a cada mensagem nova. A correção é usar um `ref` direto num `div` com `overflow-y-auto` e chamar `scrollTop = scrollHeight`.

2. **ScrollArea:** O componente `ScrollArea` do Radix UI usa `overflow-hidden` no Root e um Viewport interno para scroll. Isso torna o scroll programático inconveniente. Substituímos por um `div` simples com `overflow-y-auto` — mesma UX, controle total.

3. **Expansão via Dialog:** Extraímos o conteúdo (mensagens + input) para um componente interno `ChatContent`. O `OrderChat` gerencia todo o estado (mensagens, polling, envio) e renderiza `ChatContent` tanto no Card inline quanto dentro de um `Dialog` — sem duplicar estado ou fazer dois fetches simultâneos.

### Passo a passo

- [ ] **Passo 1: Atualizar imports**

  No topo de `src/components/order/order-chat.tsx`, substituir o bloco de imports por:

  ```tsx
  'use client'

  import { useState, useEffect, useRef, useCallback } from 'react'
  import { useAuth } from '@/contexts/auth-context'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { Badge } from '@/components/ui/badge'
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog'
  import {
    Send,
    MessageCircle,
    Lock,
    AlertCircle,
    RefreshCw,
    Shield,
    Eye,
    EyeOff,
    KeyRound,
    Maximize2,
    Minimize2,
  } from 'lucide-react'
  import { showError } from '@/lib/toast'
  import { LoadingSpinner } from '@/components/common/loading-spinner'
  import { formatMessageTime } from '@/lib/utils'
  ```

  **O que mudou:** removido `ScrollArea` (não será mais usado), adicionados `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Maximize2`, `Minimize2`.

- [ ] **Passo 2: Substituir `messagesEndRef` por `scrollAreaRef`**

  Localizar dentro da função `OrderChat` (logo abaixo das declarações de estado, linha ~174):

  ```tsx
  const messagesEndRef = useRef<HTMLDivElement>(null)
  ```

  Substituir por:

  ```tsx
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  ```

- [ ] **Passo 3: Corrigir o efeito de scroll**

  Localizar o `useEffect` que causava o bug (logo após o efeito do polling, linha ~203):

  ```tsx
  useEffect(() => {
    // Smooth scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages])
  ```

  Substituir por:

  ```tsx
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [chat?.messages])
  ```

  **Racional:** `scrollTop = scrollHeight` opera apenas no elemento referenciado, sem escalar pelo DOM. O scroll fica contido dentro do chat.

- [ ] **Passo 4: Extrair `ChatContent` como componente interno**

  Antes do `return` da função `OrderChat` (logo antes da linha com `if (loading) {`), adicionar o componente interno que renderiza mensagens + input. Esse componente recebe como props todos os dados e handlers já existentes no `OrderChat`:

  ```tsx
  const messages = chat?.messages || []
  const hasMessages = messages.length > 0

  const ChatContent = () => (
    <>
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollAreaRef}
          className="h-full overflow-y-auto p-4"
        >
          <div className="space-y-4 pb-4">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-purple/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-brand-purple-light" />
                </div>
                <p className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Nenhuma mensagem ainda
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {chatEnabled
                    ? 'Inicie a conversa com o booster'
                    : disabledReason || 'Chat indisponível'}
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwnMessage = msg.authorId === user?.id
                const showAvatar = idx === 0 || messages[idx - 1].authorId !== msg.authorId

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    {showAvatar ? (
                      <Avatar className="h-9 w-9 border-2 border-brand-purple/30 flex-shrink-0">
                        <AvatarImage src={msg.author.image || ''} />
                        <AvatarFallback className="bg-brand-purple-dark/50 text-brand-purple-lighter text-xs">
                          {msg.author.name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-9 flex-shrink-0" />
                    )}
                    <div className={`flex-1 max-w-[75%] ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                          <p className="text-sm font-semibold text-white flex items-center">
                            {msg.author.name || 'Usuário'}
                            {getRoleBadge(msg.author.role)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      )}
                      <div className={msg.messageType !== 'STEAM_CREDENTIALS' ? `rounded-2xl px-4 py-2.5 ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-brand-purple-dark to-brand-purple-dark text-white'
                            : 'bg-gray-800/80 border border-gray-700/50 text-gray-100'
                        }` : ''}>
                        {msg.messageType === 'STEAM_CREDENTIALS' ? (
                          <SteamCredentialsCard
                            content={msg.content}
                            isExpired={msg.isExpired}
                            isOwnMessage={isOwnMessage}
                          />
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                      </div>
                      {!showAvatar && (
                        <p className={`text-xs text-gray-600 mt-1 ${isOwnMessage ? 'text-right' : ''}`}>
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-brand-purple/20 flex-shrink-0">
        {chatEnabled ? (
          <div className="space-y-3">
            {user?.role === 'CLIENT' && !credentialMode && (
              <button
                type="button"
                onClick={() => setCredentialMode(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/50 hover:border-yellow-400/80 hover:from-yellow-500/30 hover:to-amber-500/20 transition-all group"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                  <KeyRound className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-yellow-300 font-orbitron leading-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Enviar Credenciais Steam
                  </p>
                  <p className="text-xs text-yellow-500/80 mt-0.5">
                    Necessário para o booster iniciar o boost
                  </p>
                </div>
                <Send className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              </button>
            )}

            {credentialMode && user?.role === 'CLIENT' ? (
              <form onSubmit={handleSendCredentials} className="space-y-2">
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/30 rounded-lg space-y-2">
                  <p className="text-xs text-yellow-400 flex items-center gap-1.5 font-semibold">
                    <Shield className="h-3.5 w-3.5" />
                    Criptografado — só o booster designado poderá ver
                  </p>
                  <Input
                    value={credUsername}
                    onChange={(e) => setCredUsername(e.target.value)}
                    placeholder="Usuário Steam"
                    className="bg-black/50 border-brand-purple/30 text-white placeholder:text-gray-500 focus:border-brand-purple-light"
                    disabled={sending}
                    autoComplete="off"
                  />
                  <Input
                    type="password"
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    placeholder="Senha Steam"
                    className="bg-black/50 border-brand-purple/30 text-white placeholder:text-gray-500 focus:border-brand-purple-light"
                    disabled={sending}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setCredentialMode(false); setCredUsername(''); setCredPassword('') }}
                    className="text-gray-400 hover:text-white"
                    disabled={sending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={sending || !credUsername.trim() || !credPassword.trim()}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                  >
                    {sending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Enviar com segurança
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="bg-black/50 border-brand-purple/30 text-white placeholder:text-gray-500 focus:border-brand-purple-light"
                  disabled={sending}
                  maxLength={2000}
                />
                <Button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="bg-gradient-to-r from-brand-purple-dark to-brand-purple-dark hover:from-brand-purple hover:to-brand-purple-dark text-white px-6"
                >
                  {sending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-gray-300 font-medium font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Chat desabilitado
              </p>
              <p className="text-gray-500 text-sm">
                {disabledReason || 'Chat disponível apenas para pedidos em andamento.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
  ```

  **Nota:** `ChatContent` é definido dentro do corpo da função `OrderChat` para ter acesso ao closure (estado, handlers, refs, user). Ele não recebe props — lê diretamente do escopo pai.

- [ ] **Passo 5: Substituir o `return` do `OrderChat`**

  Localizar o bloco `return` atual do `OrderChat` (começa na linha ~291) e substituir **completamente** por:

  ```tsx
  const chatHeader = (
    <CardHeader className="border-b border-brand-purple/20 pb-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          <MessageCircle className="h-5 w-5 text-brand-purple-light" />
          Chat do Pedido
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Lock className="h-3 w-3" />
            <span>Criptografado</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <RefreshCw className="h-3 w-3" />
            <span>{formatMessageTime(lastUpdate.toISOString())}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Expandir chat"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </CardHeader>
  )

  const securityNotice = (
    <div className="px-4 py-2 bg-brand-purple/5 border-b border-brand-purple/20 flex-shrink-0">
      <div className="flex items-start gap-2 text-xs">
        <Shield className="h-4 w-4 text-brand-purple-light flex-shrink-0 mt-0.5" />
        <p className="text-gray-400">
          Suas mensagens são criptografadas com AES-256-GCM. Compartilhe suas credenciais Steam com segurança apenas com o booster designado.
        </p>
      </div>
    </div>
  )

  return (
    <>
      <Card className={`bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-xl border border-brand-purple/30 h-[500px] flex flex-col ${className || ''}`}>
        {chatHeader}
        {securityNotice}
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <ChatContent />
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-brand-purple/30">
          <DialogHeader className="border-b border-brand-purple/20 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <MessageCircle className="h-5 w-5 text-brand-purple-light" />
                Chat do Pedido
              </DialogTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <Lock className="h-3 w-3" />
                  <span>Criptografado</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Minimizar chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </DialogHeader>
          {securityNotice}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatContent />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
  ```

  **Nota:** O `Dialog` reutiliza o mesmo `ChatContent` (mesmo escopo, mesmo estado, sem segundo polling).

- [ ] **Passo 6: Remover o `CardContent` antigo e as linhas mortas**

  Após as substituições dos passos anteriores, verificar que não restam referências a:
  - `messagesEndRef` — remover qualquer ocorrência remanescente
  - `<ScrollArea` — remover qualquer ocorrência remanescente
  - O bloco original `const messages = ...` e `const hasMessages = ...` que estava logo antes do `return` — esses devem estar agora antes da definição de `ChatContent`

- [ ] **Passo 7: Verificar no navegador**

  1. Abrir `/dashboard` com um pedido `IN_PROGRESS`
  2. Tentar scrollar as mensagens do chat — a página **não deve** se mover
  3. Clicar no ícone `Maximize2` no header do chat — o Dialog deve abrir
  4. Verificar que as mensagens aparecem no Dialog
  5. Scrollar dentro do Dialog — a página **não deve** se mover
  6. Clicar `Minimize2` ou clicar fora do Dialog para fechar
  7. Repetir em `/booster` com um pedido aceito

- [ ] **Passo 8: Commit**

  ```bash
  git add src/components/order/order-chat.tsx
  git commit -m "fix: corrigir scroll da página no chat e adicionar modal de expansão"
  ```

---

## Checklist de conclusão

- [ ] `/admin/pricing`: cores internas do Alert padronizadas (sem `text-red-200`/`text-red-300` avulsos)
- [ ] Chat: scrollar mensagens não move a página
- [ ] Chat: botão `Maximize2` visível no header do card
- [ ] Dialog abre ao clicar em `Maximize2`
- [ ] Chat dentro do Dialog preenche `h-[85vh]` sem overflow externo
- [ ] Botão `Minimize2` e clique fora fecham o Dialog
- [ ] Nenhum toast substituído por Alert
- [ ] Nenhum segundo polling criado (estado compartilhado via closure)
