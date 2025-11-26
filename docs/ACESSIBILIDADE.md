# Acessibilidade - GameBoost

Este documento descreve as ferramentas e práticas de acessibilidade implementadas no projeto GameBoost.

## 🛠️ Ferramenta Implementada

### @axe-core/react

Implementamos o **@axe-core/react**, uma biblioteca de auditoria de acessibilidade baseada no padrão da indústria axe-core.

**Por que escolhemos esta ferramenta:**
- ✅ Biblioteca moderna e amplamente utilizada
- ✅ Compatível com React e Next.js
- ✅ Fornece feedback em tempo real durante o desenvolvimento
- ✅ Baseada no axe-core, padrão da indústria
- ✅ Não afeta o bundle de produção (carregada apenas em desenvolvimento)
- ✅ Detecta problemas de acessibilidade automaticamente

## 📦 Instalação

A biblioteca já está instalada como dependência de desenvolvimento:

```bash
npm install --save-dev @axe-core/react
```

## 🚀 Como Funciona

O `AccessibilityProvider` foi integrado ao layout principal da aplicação (`src/app/layout.tsx`). Ele:

1. **Carrega apenas em desenvolvimento** - Não afeta o bundle de produção
2. **Detecta problemas automaticamente** - Analisa o DOM e identifica violações de acessibilidade
3. **Exibe no console** - Mostra problemas encontrados com detalhes e sugestões de correção
4. **Verifica padrões WCAG** - Segue as diretrizes WCAG 2.1 Level A e AA

## 📋 Regras Verificadas

O axe-core verifica as seguintes regras de acessibilidade:

- **Contraste de cores** - Garante que textos tenham contraste adequado
- **Navegação por teclado** - Verifica se todos os elementos são acessíveis via teclado
- **Atributos ARIA** - Valida uso correto de atributos ARIA
- **Nomes de botões** - Garante que botões tenham nomes acessíveis
- **Textos alternativos** - Verifica se imagens têm atributos `alt`
- **Nomes de links** - Garante que links tenham texto descritivo
- **Ordem de cabeçalhos** - Verifica hierarquia correta de headings
- **Landmarks** - Verifica uso adequado de landmarks HTML5
- **Regiões** - Valida estrutura semântica da página

## 🔍 Como Usar

### Durante o Desenvolvimento

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Abra o console do navegador (F12)

3. Navegue pelas páginas da aplicação

4. O axe-core automaticamente:
   - Analisa a página após 1 segundo do carregamento
   - Exibe problemas encontrados no console
   - Fornece detalhes sobre cada violação
   - Sugere correções

### Exemplo de Saída no Console

```
[axe-core] Violations found:
- color-contrast: Elements must have sufficient color contrast
  - Impact: serious
  - Help: https://dequeuniversity.com/rules/axe/4.7/color-contrast
  - Elements:
    * .text-gray-400
```

## 📚 Outras Ferramentas de Acessibilidade

Além do @axe-core/react, você pode usar:

### 1. WAVE (Web Accessibility Evaluation Tool)
- Extensão para Chrome/Firefox
- Fornece feedback visual sobre acessibilidade
- Disponível em: https://wave.webaim.org/

### 2. Lighthouse (Chrome DevTools)
- Ferramenta integrada ao Chrome
- Inclui auditoria de acessibilidade
- Acesse via DevTools > Lighthouse

### 3. eslint-plugin-jsx-a11y
- Plugin ESLint para verificar acessibilidade no código
- Pode ser adicionado ao projeto se necessário

## ✅ Boas Práticas Implementadas

O projeto já segue várias práticas de acessibilidade:

- ✅ Componentes baseados em Radix UI (acessíveis por padrão)
- ✅ Navegação por teclado funcional
- ✅ Atributos ARIA quando necessário
- ✅ Textos alternativos em imagens
- ✅ Contraste de cores adequado
- ✅ Estrutura semântica HTML5
- ✅ Tooltips informativos
- ✅ Labels associados a inputs
- ✅ Mensagens de erro claras

## 🎯 Objetivos

- **WCAG 2.1 Level AA** - Conformidade com padrões internacionais
- **Experiência inclusiva** - Acessível para todos os usuários
- **Detecção precoce** - Identificar problemas durante o desenvolvimento
- **Melhoria contínua** - Corrigir problemas conforme são detectados

## 📖 Recursos Adicionais

- [Documentação do axe-core](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM - Web Accessibility In Mind](https://webaim.org/)
- [MDN - Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## 🔄 Manutenção

O `AccessibilityProvider` é mantido automaticamente e não requer configuração adicional. Ele:

- Carrega apenas em desenvolvimento
- Não afeta performance em produção
- Fornece feedback contínuo durante o desenvolvimento
- Ajuda a manter o código acessível

---

**Nota:** O axe-core é uma ferramenta de desenvolvimento. Para testes completos de acessibilidade, recomenda-se também:
- Testes manuais com leitores de tela
- Testes com usuários reais
- Auditorias profissionais periódicas

