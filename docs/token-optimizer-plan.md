# Plano de Instalação e Configuração — Token Optimizer

> **Repositório:** https://github.com/alexgreensh/token-optimizer  
> **Plataforma alvo:** Windows 11 + Claude Code CLI (v2.1.177)  
> **Projeto:** gaming-boost (Next.js 15 / TypeScript / Prisma)  
> **Data:** 2026-06-13

---

## 1. O Que É o Token Optimizer

O Token Optimizer é um plugin para Claude Code que **reduz o desperdício de tokens** em três categorias:

| Tipo | Descrição | % do Contexto |
|------|-----------|---------------|
| **Estrutural** | CLAUDE.md inchado, skills não usadas, servidores MCP mortos, MEMORY.md obsoleto | 40–60% |
| **Runtime** | Saída verbosa de comandos, resultados MCP gigantes, re-leitura de arquivos | 15–25% |
| **Comportamental** | Deixar cache expirar, compactar tarde demais, loops, usar Opus onde Haiku bastaria | 15–20% |

**Benefícios principais:**
- Zero dependências externas (Python stdlib puro)
- Zero telemetria (tudo local, SQLite)
- Zero overhead de contexto basal (roda como processo externo)
- Dashboard local auto-atualizado (`http://localhost:24842/token-optimizer`)
- Checkpoint automático antes de compactação + restauração depois
- Detecção de loops comportamentais
- Scoring de qualidade do contexto (7 sinais, dual-score com notas)
- Coaching histórico de 30 dias (`/token-coach`)

---

## 2. Diagnóstico do Estado Atual

### 2.1 Requisitos Verificados ✅

| Requisito | Status | Detalhes |
|-----------|--------|----------|
| Python 3.9+ | ✅ Instalado | Python 3.14.3 (`C:\Python314`) |
| pip | ✅ Disponível | pip 25.3 |
| Claude Code | ✅ Instalado | v2.1.177 |
| Comando `python` | ✅ Funciona | Windows usa `python` (não `python3`) |
| Sistema de plugins | ✅ Ativo | Diretório `~/.claude/plugins` existe |

### 2.2 Estado Atual dos Plugins

- **Marketplaces registrados:** `claude-plugins-official`, `dotnet-agent-skills`
- **Token Optimizer instalado:** ❌ NÃO (`~/.claude/token-optimizer` não existe)
- **Marketplace alexgreensh:** ❌ NÃO registrado ainda

### 2.3 Potenciais Fontes de Desperdício no Projeto

| Item | Observação |
|------|------------|
| `CLAUDE.md` | 154 linhas, bem estruturado, mas pode ter itens que o TO otimize |
| `.claude/skills/` | **20 subdiretórios** de skills — muitos podem ser inativos e ocupando contexto |
| `.claude/rules/` | 5 arquivos de regras (carregados toda sessão) |
| `.mcp.json` | 2 servidores MCP configurados (`next-devtools`, `ai-elements`) |
| `.claude/settings.local.json` | **112 permissões `allow`** listadas (muitas redundantes/específicas demais) |
| Plugins dotnet | **12 plugins dotnet** instalados no escopo do projeto gaming-boost — projeto é Node.js/Next.js, não precisa deles |

> [!WARNING]
> O projeto tem **12 plugins .NET instalados** (`dotnet`, `dotnet-data`, `dotnet-test`, etc.) para um projeto Next.js/TypeScript. Esses plugins provavelmente geram overhead de contexto desnecessário. O Token Optimizer vai detectar e recomendar a remoção.

---

## 3. Plano de Instalação (Passo a Passo)

### 3.1 Pré-requisitos (já atendidos)

```
✅ Python 3.9+ instalado
✅ Claude Code CLI instalado
✅ Sistema de plugins ativo
```

### 3.2 Instalação via Plugin Marketplace (Método Recomendado para Windows)

> [!IMPORTANT]
> No Windows, use **SOMENTE** o método de plugin marketplace. **NÃO** execute o `install.sh` — ele é um script bash para macOS/Linux e pode causar erro `EBUSY: resource busy or locked` no Windows.

**Executar dentro do Claude Code CLI:**

```bash
# Passo 1: Adicionar o marketplace do Token Optimizer
/plugin marketplace add alexgreensh/token-optimizer

# Passo 2: Instalar o plugin
/plugin install token-optimizer@alexgreensh-token-optimizer
```

### 3.3 Habilitar Auto-Update

> [!TIP]
> O Claude Code vem com auto-update **desabilitado por padrão** para marketplaces de terceiros. Sem isso, você não recebe correções automaticamente.

**Executar dentro do Claude Code CLI:**

```
/plugin → Aba "Marketplaces" → selecionar "alexgreensh-token-optimizer" → Habilitar auto-update
```

### 3.4 Primeira Execução

```bash
# Dentro do Claude Code, rodar o audit inicial
/token-optimizer
```

Isso vai:
1. Escanear toda a configuração (CLAUDE.md, skills, MCP, memória)
2. Identificar desperdício estrutural
3. Aplicar correções automáticas (com confirmação)
4. Configurar hooks automáticos (SessionStart, SessionEnd)

### 3.5 Configurar o Dashboard (Opcional, Recomendado)

O Dashboard é servido como HTML local auto-regenerado. Para configurá-lo como daemon persistente:

```bash
# No PowerShell (fora do Claude Code), dentro da pasta do plugin:
python C:\Users\Admin\.claude\plugins\marketplaces\alexgreensh-token-optimizer\skills\token-optimizer\scripts\measure.py setup-daemon
```

> **Nota:** No Windows, o daemon usa o **Task Scheduler** ao invés de launchd/systemd.

Após configurado, acesse: **http://localhost:24842/token-optimizer**

Para expor na LAN (acesso de outros dispositivos):

```bash
$env:TOKEN_OPTIMIZER_DASHBOARD_HOST = "0.0.0.0"
python measure.py setup-daemon
```

---

## 4. Configuração Pós-Instalação

### 4.1 Comandos Disponíveis

| Comando | Quando Usar | O Que Faz |
|---------|-------------|-----------|
| `/token-optimizer` | Após instalar (uma vez) | Audit completo: escaneia, encontra waste, corrige |
| `/token-optimizer quick` | A qualquer momento | Health check de 10s: fill do contexto, quality score, top issues |
| `/token-coach` | Semanalmente | Analisa 30 dias de histórico: tendências, eficiência, planejamento |

### 4.2 O Que Roda Automaticamente (Sem Intervenção)

Após a instalação, **tudo abaixo é automático**:

- **Smart Compaction**: checkpoint antes, restore depois (nunca perde trabalho)
- **Compressão ativa**: output de CLI comprimido (30+ famílias de comandos)
- **Quality scoring**: nota dupla por sessão (v6 dual-score)
- **Loop detection**: interrompe loops comportamentais antes de queimar tokens
- **Read deduplication**: re-leituras servem diff apenas
- **Model routing nudges**: sugere usar modelos mais baratos quando possível
- **Dashboard update**: regenera HTML após cada sessão via hook SessionEnd

### 4.3 Configuração de Pricing (Para Dashboard)

O dashboard calcula custos com base em 4 tiers:
- Anthropic API (padrão)
- Vertex Global
- Vertex Regional
- AWS Bedrock

Para configurar o seu tier:
```bash
# No primeiro uso, o dashboard pergunta. Ou configure manualmente:
# O tier é salvo e persiste entre sessões
```

---

## 5. Ações Específicas para o Projeto gaming-boost

### 5.1 Limpeza de Plugins Desnecessários

Os 12 plugins .NET instalados devem ser removidos do escopo deste projeto:

```bash
# Dentro do Claude Code, para cada plugin dotnet:
/plugin uninstall dotnet@dotnet-agent-skills
/plugin uninstall dotnet-data@dotnet-agent-skills
/plugin uninstall dotnet-test@dotnet-agent-skills
/plugin uninstall dotnet-aspnet@dotnet-agent-skills
/plugin uninstall dotnet-nuget@dotnet-agent-skills
/plugin uninstall dotnet-upgrade@dotnet-agent-skills
/plugin uninstall dotnet-msbuild@dotnet-agent-skills
/plugin uninstall dotnet-diag@dotnet-agent-skills
/plugin uninstall dotnet-ai@dotnet-agent-skills
/plugin uninstall dotnet-template-engine@dotnet-agent-skills
/plugin uninstall dotnet11@dotnet-agent-skills
/plugin uninstall dotnet-maui@dotnet-agent-skills
```

> [!NOTE]
> Esses plugins serão mantidos no projeto `ceg-back` (C#/.NET) onde fazem sentido.

### 5.2 Auditoria de Skills

O diretório `.claude/skills/` tem **20 subdiretórios**. O Token Optimizer vai auditar quais são realmente usados e recomendar desabilitar os inativos. Skills que parecem irrelevantes para um projeto Next.js:
- `go/` — Linguagem Go
- `chrome-devtools/` — Pode ser útil
- `postgres-hardening/` — Útil (projeto usa PostgreSQL)
- `handoff/` — Verificar se é usado

### 5.3 Auditoria do CLAUDE.md

O `CLAUDE.md` atual tem 154 linhas. O Token Optimizer vai analisar:
- Linhas que passam da "curva de atenção" (>200 linhas = invisíveis para o modelo)
- Seções duplicadas ou redundantes
- Referências obsoletas a features removidas
- Otimizar estrutura para máxima retenção

### 5.4 Limpeza de Permissões

O `settings.local.json` tem **112 permissões `allow`** com muitas entradas ultra-específicas (ex: `sed` commands hardcoded). Isso pode ser simplificado, embora o Token Optimizer foque mais em skills/MCP do que em permissões.

---

## 6. Recuperação de Erros (Windows)

### Se a instalação falhar com `EBUSY: resource busy or locked`:

1. Fechar **todas** as janelas do Claude Code e terminais Git Bash
2. Abrir Task Manager → encerrar processos `git.exe` pendentes
3. Deletar as pastas (se existirem):
   ```
   C:\Users\Admin\.claude\token-optimizer
   C:\Users\Admin\.claude\plugins\marketplaces\alexgreensh-token-optimizer
   ```
4. Se Windows recusar deletar → reiniciar o PC → deletar
5. Abrir nova janela Claude Code → rodar os comandos `/plugin` novamente

### Fallback Manual (ZIP):

Se o plugin marketplace falhar repetidamente:
1. Baixar ZIP da [release mais recente](https://github.com/alexgreensh/token-optimizer/releases/latest)
2. Baixar o `CHECKSUMS.sha256` da mesma release
3. Extrair e verificar checksums
4. Rodar:
   ```powershell
   python C:\Users\Admin\.claude\token-optimizer\measure.py setup-quality-bar
   ```

---

## 7. Checklist de Execução

- [ ] **Passo 1:** No Claude Code CLI, rodar `/plugin marketplace add alexgreensh/token-optimizer`
- [ ] **Passo 2:** Rodar `/plugin install token-optimizer@alexgreensh-token-optimizer`
- [ ] **Passo 3:** Habilitar auto-update no marketplace
- [ ] **Passo 4:** Rodar `/token-optimizer` para audit inicial
- [ ] **Passo 5:** Configurar dashboard daemon (`python measure.py setup-daemon`)
- [ ] **Passo 6:** Remover plugins .NET desnecessários do projeto gaming-boost
- [ ] **Passo 7:** Revisar recomendações do audit e aplicar
- [ ] **Passo 8:** Rodar `/token-optimizer quick` para validar estado final
- [ ] **Passo 9:** Após uma semana, rodar `/token-coach` para análise de tendências

---

## 8. Métricas Esperadas

Com base no perfil do projeto (CLAUDE.md de 154 linhas, 20 skills, 12 plugins desnecessários, 2 MCP servers):

| Métrica | Antes | Depois (Estimativa) |
|---------|-------|---------------------|
| Skills ativas / instaladas | ? / 20 | Apenas as necessárias |
| Plugins .NET no projeto | 12 | 0 |
| Contexto basal estimado | Alto (muitas skills) | Reduzido significativamente |
| Compaction survival | 0% (sem checkpoints) | ~95% (com smart compaction) |
| Quality scoring | Sem medição | Score dual v6 por sessão |
| Custo mensal | Sem visibilidade | Dashboard com tracking completo |

---

## 9. Referências

- [Repositório Token Optimizer](https://github.com/alexgreensh/token-optimizer)
- [Instruções Windows (seção do README)](https://github.com/alexgreensh/token-optimizer#windows-users-read-this-first)
- [Releases (para fallback manual)](https://github.com/alexgreensh/token-optimizer/releases/latest)
- [Benchmark e Metodologia](https://github.com/alexgreensh/token-optimizer/blob/main/BENCHMARK.md)
