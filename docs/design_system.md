# Design System & UI Documentation

## Visão Geral
Este Design System une a identidade visual do Gaming Boost (baseada em Roxo Neon e Dark Mode) com uma estrutura de tokens semânticos para garantir consistência.

> **Regra de Ouro**: NUNCA use valores hexadecimais ou arbitrários (ex: `#7C3AED`, `px-4`) diretamente no código. Use sempre os **Tokens** descritos abaixo.

## CORES & TOKENS

Os valores abaixo foram extraídos da configuração atual (`tailwind.config.js` e `globals.css`).

### Paleta Base (Referência)
* **Brand Purple**: `#7C3AED` (DEFAULT), `#4C1D95` (Dark), `#A855F7` (Light)
* **Brand Black**: `#0A0A0A` (Background), `#1A1A1A` (Surface)
* **Brand Red**: `#DC2626` (Error)

### Mapeamento de Tokens

#### Texto (`text-*`)
| Token | Valor (Dark) | Aplicação |
| :--- | :--- | :--- |
| **text-primary** | `#FFFFFF` | Títulos, texto principal |
| **text-secondary** | `#D1D5DB` (gray-300) | Legendas, descrições |
| **text-muted** | `#6B7280` (gray-500) | Placeholders, textos desabilitados |
| **text-on-brand** | `#FFFFFF` | Texto sobre botões roxos/vermelhos |
| **text-brand** | `#7C3AED` | Texto com a cor da marca (links, destaques) |

#### Superfícies / Fundos (`bg-*` ou custom)
| Token | Valor (Dark) | Aplicação |
| :--- | :--- | :--- |
| **surface-page** | `#0A0A0A` | Fundo principal da página (Body) |
| **surface-section** | `#0A0A0A` | Seções principais |
| **surface-card** | `#1A1A1A` | Cards, Sidebar, Elementos flutuantes |
| **surface-subtle** | `#27272a` | Hover states em listas |
| **surface-elevated** | `#1A1A1A` | Modais, Popovers (com shadow) |

#### Ações / Botões (`bg-*` + Hover)
| Token | Valor (Dark) | Aplicação |
| :--- | :--- | :--- |
| **action-primary** | `#7C3AED` (Purple) | Botão Principal |
| **action-primary-hover** | `#A855F7` (Light Purple) | Hover do Botão Principal |
| **action-secondary** | `transparent` (Border) | Botão Secundário (Outline) |
| **action-strong** | `#4C1D95` (Dark Purple) | CTAs de alta conversão / fundos de destaque |
| **action-danger** | `#DC2626` (Red) | Botões de perigo/erro |

#### Status
| Token | Valor | Aplicação |
| :--- | :--- | :--- |
| **status-success** | `#10B981` | Sucesso, Confirmação |
| **status-warning** | `#F59E0B` | Alertas |
| **status-error** | `#DC2626` | Erros, Falhas |

#### Bordas
| Token | Valor (Dark) | Aplicação |
| :--- | :--- | :--- |
| **border-default** | `#27272a` | Divisórias de cards, inputs |
| **border-brand** | `#7C3AED` | Borda ativa / foco |

---

## ESPAÇAMENTO & GRID

Utilize a escala padrão do TailwindCSS.

* **Layout Container**: `container mx-auto px-4` (MaxWidth: 1280px)
* **Section Spacing**: `py-12` ou `py-20` (Grandes seções)
* **Card Padding**: `p-6` (padrão)
* **Gap**: `gap-4`, `gap-8`

---

## TIPOGRAFIA

**Fontes**:
* `font-orbitron`: Títulos, Headlines (Identidade visual)
* `font-rajdhani`: Subtítulos, UI Elements técnicos
* `font-sans` (Inter/System): Corpo de texto, leitura longa

**Pesos**:
* `font-normal` (400)
* `font-medium` (500)
* `font-bold` (700)

---

## COMPONENTES OBRIGATÓRIOS

### 1. Botões
#### Primary Button
```tsx
<button className="bg-[#7C3AED] hover:bg-[#A855F7] text-white font-bold py-3 px-6 rounded-lg transition-all shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.7)]">
  Texto do Botão
</button>
```
*Tokenizado*: `bg-action-primary hover:bg-action-primary-hover text-on-brand ...`

### 2. Cards
```tsx
<div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-6 hover:border-[#7C3AED]/50 transition-colors">
  Conteúdo
</div>
```
*Tokenizado*: `bg-surface-card border-border-default hover:border-border-brand ...`

### 3. Inputs
```tsx
<input className="bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-all" />
```
*Tokenizado*: `bg-surface-card border-border-default focus:border-border-brand ...`

---

## EFEITOS ESPECIAIS (Glow & Neon)

Utilize as classes utilitárias globais para efeitos de marca:

* `.animate-glow`: Pulsação suave do glow roxo.
* `.hover-glow`: Aplica glow roxo apenas no hover.
* `.bg-gradient-brand`: Gradiente fundo padrão (`#0A0A0A` -> `#1A1A1A` -> `#4C1D95`).
