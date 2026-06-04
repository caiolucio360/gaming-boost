---
trigger: always_on
---

# Git Flow

Este repositório usa **dois branches permanentes**: `main` e `dev`. Nenhum outro branch é permanente.

## Branches permanentes

- **`main`** — produção. Sempre deployável e estável. Só recebe merge via PR vindo de `dev` (release) ou de um `hotfix/*`. É o branch default e protegido.
- **`dev`** — integração. Base de todo trabalho novo. Reflete o próximo release.

## Branches temporários (sempre apagar após o merge)

Criados a partir de `dev`, com PR de volta para `dev`:

- `feat/<descricao>` — nova funcionalidade
- `fix/<descricao>` — correção de bug
- `chore/<descricao>` — manutenção, deps, config
- `refactor/<descricao>` — refatoração sem mudança de comportamento
- `style/<descricao>` — UI/formatação
- `test/<descricao>` — apenas testes

Exceção — **`hotfix/<descricao>`**: sai de `main` (não de `dev`) para corrigir produção urgente. Faz PR para `main` **e** depois é propagado para `dev` (merge ou cherry-pick) para não regredir.

## Fluxo padrão

```bash
# 1. Começar a partir da dev atualizada
git checkout dev && git pull
git checkout -b feat/minha-feature

# 2. Trabalhar, commitar (Conventional Commits), push
git push -u origin feat/minha-feature

# 3. Abrir PR  feat/minha-feature -> dev
gh pr create --base dev

# 4. Após aprovar/mergear: apagar o branch (local + remoto)
git checkout dev && git pull
git branch -d feat/minha-feature
git push origin --delete feat/minha-feature
```

## Release (dev -> main)

```bash
gh pr create --base main --head dev --title "release: <versão/escopo>"
```

## Regras

- **Nunca** commitar direto em `main` ou `dev` — sempre via branch temporário + PR.
- **Nunca** fazer PR de um branch de feature direto para `main` (exceto `hotfix/*`).
- **Squash merge** é a estratégia padrão dos PRs.
- **Sempre apagar** o branch temporário após o merge (local e remoto). Não acumular branches.
- Branches devem ser de vida curta — sincronize com `dev` com frequência (`git merge dev` ou rebase) para evitar conflitos grandes.
- Mensagens de commit e títulos de PR seguem **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `test:`, `docs:`).
