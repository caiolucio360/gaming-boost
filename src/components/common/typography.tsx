import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Typography primitives — the single place brand fonts are applied.
 *
 * Fonts are loaded via `next/font` in `layout.tsx` and exposed as the
 * `font-orbitron` / `font-rajdhani` Tailwind classes. Do NOT add inline
 * `style={{ fontFamily }}` fallbacks — they point at a system font name, not
 * the loaded face, and silently degrade. Use these components (or the shadcn
 * `CardTitle`/`DialogTitle`, which already carry the brand font) instead.
 */

type HeadingLevel = 1 | 2 | 3 | 4

const headingSizes: Record<HeadingLevel, string> = {
  1: 'text-4xl font-bold',
  2: 'text-2xl font-bold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-semibold',
}

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level — controls both the rendered tag and the default size. */
  level?: HeadingLevel
  /** Render a different tag than the one implied by `level` (e.g. an h2 styled as level 3). */
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export function Heading({ level = 1, as, className, ...props }: HeadingProps) {
  const Tag = (as ?? `h${level}`) as 'h1'
  return (
    <Tag
      className={cn('font-orbitron text-white', headingSizes[level], className)}
      {...props}
    />
  )
}

type TextColor = 'default' | 'muted' | 'subtle' | 'white'

const textColors: Record<TextColor, string> = {
  white: 'text-white',
  default: 'text-brand-gray-300',
  muted: 'text-brand-gray-400',
  subtle: 'text-brand-gray-500',
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Render as a `span` instead of a `p`. */
  as?: 'p' | 'span'
  color?: TextColor
}

export function Text({ as = 'p', color = 'default', className, ...props }: TextProps) {
  const Tag = as as 'p'
  return (
    <Tag
      className={cn('font-rajdhani', textColors[color], className)}
      {...props}
    />
  )
}
