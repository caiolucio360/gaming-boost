# Implementação de Tema Claro/Escuro (Light & Dark Mode)

Este plano detalha a implementação da funcionalidade de alternância entre tema claro e escuro. A aplicação já possui o pacote `next-themes` instalado e as variáveis de cor baseadas no Shadcn UI estão configuradas no arquivo de CSS global. O objetivo é permitir que o usuário escolha o tema e essa preferência seja salva automaticamente (utilizando localStorage e suporte do `next-themes`).

## Requisitos de Qualidade Visual e Contraste (Diretrizes CRÍTICAS)

Para garantir que a troca de temas funcione **perfeitamente**, sem textos invisíveis, baixo contraste ou elementos que fiquem de fora da estilização global, os seguintes requisitos serão seguidos em toda a base de código:

> [!WARNING]
> Nenhuma cor "rígida" (hardcoded) como `text-white`, `text-black`, `bg-black`, `bg-white` deve ser usada de forma genérica. Todo o estilo de cor deve depender do sistema de variáveis do tema.

1. **Substituição de Cores Estáticas por Tokens Semânticos:**
   - Onde houver `bg-black`, `bg-white`, substituir por `bg-background` (ou `bg-card` para cartões).
   - Onde houver `text-white` ou `text-black`, substituir por `text-foreground`.
   - Cores de fundo secundárias (`bg-brand-black-light`) devem ser convertidas para usar variáveis de tema como `bg-muted` ou `bg-secondary`.

2. **Garantia de Legibilidade (Contraste):**
   - Textos de ajuda, parágrafos secundários e subtítulos devem usar `text-muted-foreground` para garantir contraste adequado em ambos os temas.
   - Bordas separadoras devem usar `border-border` no lugar de cores fixas (ex: `border-white/10` passará a ser `border-border` ou `border-foreground/10`).
   - Botões com cores da marca (`bg-brand-purple`) devem garantir que o texto dentro deles use um contraste forte (geralmente branco puro ou preto puro, dependendo do tom do roxo no modo light/dark).

3. **Elementos Sobrepostos (Modais, Dropdowns, Tooltips):**
   - Todos os modais (`Dialog`), menus (`DropdownMenu`) e dicas (`Tooltip`) devem utilizar as classes `bg-popover text-popover-foreground` para garantir que se destaquem do fundo corretamente tanto no claro quanto no escuro.

4. **Remoção de Gradientes e Filtros Incompatíveis:**
   - Os estilos que dependem de sombras brancas ou pretas literais (ex: `bg-black/60 backdrop-blur-sm`) devem ser ajustados para usar variáveis neutras, como `bg-background/80`, para que o overlay respeite a temática ativa.

---

## Etapa Pré-Implementação (Pre-Implementation)

### Estudo e Mapeamento dos Tokens Atuais do Projeto
- Antes de iniciar qualquer alteração, é necessário aprender e mapear profundamente os tokens de cor atuais do projeto.
- Analisar os arquivos vitais do design system (`tailwind.config.js`, `src/app/globals.css` e `components.json`).
- Entender como o Tailwind e o Shadcn UI foram configurados nesta base de código específica para garantir que a migração de cores fixas (como `bg-brand-black`) para variáveis dinâmicas (como `bg-background` ou `bg-card`) seja precisa e sem regressões visuais.

---

## Proposta de Alterações (Proposed Changes)

### Provedor de Tema e Componentes Base

#### [NEW] `src/components/providers/theme-provider.tsx`
- Criar o componente `ThemeProvider` que embrulha o pacote `next-themes` para Next.js, mantendo a diretiva `'use client'`.

#### [NEW] `src/components/common/theme-toggle.tsx`
- Criar um componente de botão interativo (Dropdown) contendo ícones de Sol e Lua da biblioteca `lucide-react`.
- O botão permitirá ao usuário selecionar entre "Claro", "Escuro" ou "Sistema".
- O componente será utilizado tanto no site público quanto nas áreas restritas (Dashboards).

---

### Layouts e Integração

#### [MODIFY] `src/app/layout.tsx`
- Remover as classes fixadas no HTML e no Body (`className="dark"`, `text-white bg-black`) para permitir a flexibilidade de temas.
- Substituir por `bg-background text-foreground`.
- Adicionar o atributo `suppressHydrationWarning` na tag `<html>`.
- Envolver toda a árvore de componentes com o recém-criado `ThemeProvider`.

#### [MODIFY] `src/components/layout/elojob-header.tsx`
- Adicionar o componente `ThemeToggle` no cabeçalho do site público.
- Remover cores fixas (`bg-brand-black/80`, `text-white`) e aplicar `bg-background/80 text-foreground` e `border-border`.

#### [MODIFY] `src/components/layout/app-shell.tsx`
- Inserir o `ThemeToggle` na barra superior (top bar) das áreas de administração e booster.
- Revisar cores rígidas (`bg-brand-black` para o main, bordas de menus e textos `text-white`) e aplicar as variáveis semânticas para garantir boa visualização em telas de tabela e dashboards.

---

### Padronização Global em Páginas e Componentes

#### [MODIFY] Diversos Arquivos em `src/app/` e `src/components/`
- Realizar uma varredura rigorosa em todas as páginas e componentes existentes.
- Substituir instâncias de `bg-brand-black`, `bg-brand-black-light`, `text-white`, `border-white/10` pelos tokens corretos do Shadcn (`bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `border-border`, etc).
- Garantir que nenhum componente individual (como botões customizados, cards soltos ou blocos de texto) force uma cor fixa que destoe do tema global do usuário.

---

## Plano de Verificação (Verification Plan)

### Teste Manual de Qualidade (QA Visual)
1. **Verificação de Contrastes:** Navegar por páginas-chave (Página Inicial, Dashboard de Admin, Carrinho) e validar se existem textos impossíveis de ler ("preto no escuro" ou "branco no claro").
2. **Componentes Flutuantes:** Abrir modais, menus dropdown (como o menu de Perfil) e verificar se as bordas e fundos estão coesos com o tema atual.
3. **Persistência de Dados:** Mudar o tema, recarregar a página e confirmar se não existe "piscar" da tela preta antes de carregar o modo claro.
