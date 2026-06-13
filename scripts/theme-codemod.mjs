#!/usr/bin/env node
/**
 * Phase 2 theme codemod — migrate neutral brand classes to shadcn semantic tokens
 * so pages adapt to light/dark. Brand-purple accents are intentionally preserved.
 *
 * Safe global replacements (anywhere): grays, neutral borders, brand-black surfaces.
 * Context-aware: `text-white` becomes `text-foreground` EXCEPT inside a className
 * literal that also carries a SOLID saturated background (purple/red/green/etc.),
 * where white-on-color must stay white.
 *
 * Run: node scripts/theme-codemod.mjs        (writes changes)
 *      node scripts/theme-codemod.mjs --dry   (report only)
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const DRY = process.argv.includes('--dry')
const SCAN_DIRS = ['src/app', 'src/components']
// ui/ primitives are already tokenized; charts page keeps Recharts hex (not classes anyway).
const SKIP_DIRS = ['src/components/ui']

// Literals that contain a SOLID saturated background keep their white text.
const SOLID_BG = /bg-(?:brand-purple(?:-dark|-light)?|brand-red|destructive|primary)(?![\w/-])|bg-(?:red|green|blue|yellow|orange|amber|emerald|rose|pink|indigo)-\d{2,3}(?![\w/])|bg-gradient-/

function transform(src) {
  let s = src

  // 1) Safe, context-free replacements ------------------------------------
  s = s.replace(/\btext-brand-gray-(?:300|400|500)\b/g, 'text-muted-foreground')
  s = s.replace(/\bborder-white\/(?:10|5)\b/g, 'border-border')
  s = s.replace(/\bbg-brand-black-light\b/g, 'bg-card')
  s = s.replace(/\bbg-brand-black\/(\d{1,3})\b/g, 'bg-background/$1')
  s = s.replace(/\bbg-brand-black\b/g, 'bg-background')
  // Subtle inner panels use literal black tints at low opacity; map to a theme-aware
  // muted surface. Higher opacities (/50+) are modal/scrim overlays — leave them.
  s = s.replace(/\bbg-black\/20\b/g, 'bg-muted/40')
  s = s.replace(/\bbg-black\/30\b/g, 'bg-muted/60')
  // Fixed dark "glass" card gradient -> themed card surface (purple border/hover stays).
  s = s.replace(
    /bg-gradient-to-br from-(?:brand-)?black\/40 via-(?:brand-)?black\/30 to-(?:brand-)?black\/40(?:\s+backdrop-blur-md)?/g,
    'bg-card'
  )

  // 1b) Light status-tag / value text (text-*-300) is unreadable on light surfaces.
  // Make it foreground in light, keep the color in dark. Skip prefixed variants
  // (hover:/focus:/dark:) via the lookbehind so e.g. the red "Sair" hover stays.
  s = s.replace(
    /(?<!:)\btext-(green|yellow|red|blue|orange|amber)-300\b/g,
    'text-foreground dark:text-$1-300'
  )

  // 2) Context-aware text-white -> text-foreground ------------------------
  // Operate per string literal so we can inspect the surrounding classes.
  const literal = /(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g
  s = s.replace(literal, (full, quote, body) => {
    if (!body.includes('text-white')) return full
    if (SOLID_BG.test(body)) return full // white-on-color stays white
    const next = body.replace(/\btext-white\b/g, 'text-foreground')
    return quote + next + quote
  })

  return s
}

const files = []
function walk(dir) {
  let entries
  try { entries = readdirSync(join(ROOT, dir)) } catch { return }
  for (const name of entries) {
    const rel = join(dir, name).replace(/\\/g, '/')
    if (SKIP_DIRS.some((d) => rel === d || rel.startsWith(d + '/'))) continue
    const st = statSync(join(ROOT, rel))
    if (st.isDirectory()) walk(rel)
    else if (rel.endsWith('.tsx')) files.push(rel)
  }
}
SCAN_DIRS.forEach(walk)

let changed = 0
for (const file of files) {
  const before = readFileSync(join(ROOT, file), 'utf8')
  const after = transform(before)
  if (after !== before) {
    changed++
    const diffCount = before.split('\n').filter((l, i) => l !== after.split('\n')[i]).length
    console.log(`  ${file}  (~${diffCount} lines)`)
    if (!DRY) writeFileSync(join(ROOT, file), after)
  }
}
console.log(`\n${DRY ? '[dry] ' : ''}${changed} file(s) ${DRY ? 'would change' : 'changed'} of ${files.length} scanned.`)
