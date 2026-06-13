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
- **Merge em `dev`: a IA pode fazer.** Depois de criar o branch temporário, commitar e abrir o PR para `dev`, a IA pode aprovar e mergear (squash) esse PR em `dev` e apagar o branch temporário (local + remoto).
- **Merge em `main`: somente o dono.** A IA pode abrir o PR de release (`dev → main`) e reportar o link, mas **nunca** faz o merge em `main` — isso é exclusivo do dono. Não rodar `gh pr merge` mirando `main`.
- **Squash merge** é a estratégia padrão dos PRs.
- **Sempre apagar** o branch temporário após o merge (local e remoto). Não acumular branches.
- Branches devem ser de vida curta — sincronize com `dev` com frequência (`git merge dev` ou rebase) para evitar conflitos grandes.
- **Sempre verificar e resolver conflitos de branch.** Ao abrir um PR, conferir o estado de merge (`gh pr view <n> --json mergeable,mergeStateStatus`). Se estiver `CONFLICTING`, trazer a branch base para a branch de trabalho (`git merge main`/`git merge dev`), resolver os conflitos mantendo a intenção de ambos os lados, e dar push — deixando o PR `MERGEABLE` antes de entregá-lo. Nunca deixar um PR com conflito pendente para o dono resolver.
- Mensagens de commit e títulos de PR seguem **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `test:`, `docs:`).
- **Mensagens de commit e PRs (título e corpo) são sempre escritos em inglês.**

## Versionamento

**Fonte única da verdade: `package.json` → `"version"`.** O valor é injetado em build via
`next.config.js` (`env.NEXT_PUBLIC_APP_VERSION`) e lido por `src/lib/version.ts` (`APP_VERSION`),
exibido no rodapé da sidebar do painel. **Não edite `version.ts`** — só o `package.json`.

- **Sempre que algo for alterado e commitado, suba a versão** no mesmo commit, de preferência
  com `npm version <patch|minor|major> --no-git-tag-version` (atualiza só o `package.json`).
- Use **semver** (`MAJOR.MINOR.PATCH`), alinhado ao tipo do Conventional Commit:
  - `fix:` / `chore:` / `style:` / `refactor:` / `docs:` / `test:` → **patch**.
  - `feat:` → **minor**.
  - Mudança incompatível (`feat!:` / `BREAKING CHANGE`) → **major**.
- Um commit = um bump. Não acumular várias mudanças sem subir a versão.
- A base atual (`0.92.69`) foi derivada do histórico (92 `feat` → minor, 69 `fix` → patch,
  0 breaking → major 0). Daqui pra frente, incremente a partir dela.
