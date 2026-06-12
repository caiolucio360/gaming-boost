/**
 * System version — **single source of truth is `package.json` "version"**.
 *
 * The value is injected at build time via `next.config.js` → `env.NEXT_PUBLIC_APP_VERSION`,
 * so there's nothing to keep in sync here: bump `package.json` (e.g. `npm version patch|minor|major`)
 * and this constant follows automatically. Shown in the panel sidebar footer.
 *
 * See `.claude/rules/git-flow.md` → "Versionamento".
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'
