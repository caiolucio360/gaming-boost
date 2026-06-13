#!/usr/bin/env node
/**
 * Design-system guard — fails the build if forbidden styling patterns reappear.
 *
 * Why a script and not an ESLint rule: this project runs Next 15 + ESLint 9 with a
 * legacy `.eslintrc.json`, where custom top-level `no-restricted-syntax` rules are not
 * honored. This check is deterministic and also catches template literals / `cn()` args
 * that AST selectors miss. Run via `npm run lint` (chained) or `npm run lint:ds`.
 *
 * Rules enforced (see .claude/rules/design_system.md):
 *  - no raw Tailwind gray-* classes (use brand-gray-* / brand-black-light)
 *  - no legacy CSS token classes (bg-surface-*, bg-action-*, border-border-*, text-on-brand,
 *    standalone text-primary/secondary/muted, bg-[var(--...)])
 *  - no inline fontFamily fallback (fonts come from next/font + font-orbitron/font-rajdhani)
 *  - no hardcoded hex colors inside a className
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['src/app', 'src/components']
// Vendored shadcn primitives legitimately carry shadcn design tokens.
const SKIP_DIRS = ['src/components/ui']
// Documented exceptions (design_system.md): Recharts colors/fonts + email templates.
const FONT_HEX_EXCEPTIONS = [
  'src/app/admin/page.tsx',
  'src/app/api/admin/charts/route.ts',
  'src/lib/email.ts',
  'src/services/verification.service.ts',
]

const checks = [
  {
    name: 'raw-gray',
    re: /\b(text|bg|border|from|via|to|ring|divide|placeholder|fill|stroke|decoration|accent|caret|outline)-gray-\d/,
    msg: 'raw Tailwind gray-* class — use text-muted-foreground / bg-muted / brand-gray-*',
  },
  {
    name: 'legacy-token',
    re: /\b(bg-surface-|bg-action-|border-border-|text-on-brand)|\btext-(primary|secondary|muted)(?![\w-])|bg-\[var\(--/,
    msg: 'forbidden CSS token class — use the theme tokens / brand palette',
  },
  {
    // Theme regression guard: these fixed neutral classes don't adapt to light/dark.
    // Use semantic tokens so themes work. (text-white is still allowed for text on a
    // solid colored background; brand-purple accents are fine.)
    name: 'non-theme-neutral',
    re: /\bbg-brand-black-light\b|\bbg-brand-black(?![\w-])|\bborder-white\/(?:5|10)\b|\btext-brand-gray-(?:300|400|500)\b|\bbg-black\/(?:20|30)\b/,
    msg: 'fixed neutral class won’t theme-switch — use bg-card/bg-background/bg-muted, border-border, or text-muted-foreground',
  },
  {
    name: 'inline-font',
    re: /style=\{\{[^}]*fontFamily:\s*['"]/,
    msg: 'inline fontFamily fallback — use the font-orbitron / font-rajdhani class alone',
    fontHexExcept: true,
  },
  {
    name: 'hex-in-className',
    re: /className=(?:"[^"]*#[0-9a-fA-F]{3,8}|`[^`]*#[0-9a-fA-F]{3,8}|\{`[^`]*#[0-9a-fA-F]{3,8})/,
    msg: 'hardcoded hex color in className — use a brand palette class',
    fontHexExcept: true,
  },
]

const files = []
function walk(dir) {
  const abs = join(ROOT, dir)
  let entries
  try { entries = readdirSync(abs) } catch { return }
  for (const name of entries) {
    const rel = join(dir, name).replace(/\\/g, '/')
    if (SKIP_DIRS.some((d) => rel === d || rel.startsWith(d + '/'))) continue
    const st = statSync(join(ROOT, rel))
    if (st.isDirectory()) walk(rel)
    else if (rel.endsWith('.tsx')) files.push(rel)
  }
}
SCAN_DIRS.forEach(walk)

const violations = []
for (const file of files) {
  const lines = readFileSync(join(ROOT, file), 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const c of checks) {
      if (c.fontHexExcept && FONT_HEX_EXCEPTIONS.includes(file)) continue
      if (c.re.test(line)) {
        violations.push({ file, line: i + 1, rule: c.name, msg: c.msg, text: line.trim().slice(0, 120) })
      }
    }
  })
}

if (violations.length) {
  console.error(`\n✖ Design-system check failed — ${violations.length} violation(s):\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}] ${v.msg}`)
    console.error(`      ${v.text}`)
  }
  console.error('\nSee .claude/rules/design_system.md.\n')
  process.exit(1)
}
console.log(`✓ Design-system check passed (${files.length} files).`)
