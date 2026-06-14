import type { ReactNode } from 'react'
import Link from 'next/link'
import { TrustpilotBadge } from '@/components/trustpilot/trustpilot-badge'
import { APP_VERSION } from '@/lib/version'

const NAV_GROUPS = [
  {
    title: 'Jogos',
    links: [{ href: '/games/cs2', label: 'Counter-Strike 2' }],
  },
  {
    title: 'Serviços',
    links: [
      { href: '/games/cs2/pricing', label: 'Boost de Rank' },
      { href: '/games/cs2/pricing?service=COACHING', label: 'Coaching' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { href: '/terms', label: 'Termos de Uso' },
      { href: '/privacy', label: 'Política de Privacidade' },
    ],
  },
] as const

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-brand-purple transition-colors"
    >
      {children}
    </Link>
  )
}

export function Footer() {
  return (
    <footer
      className="relative bg-background text-foreground"
      role="contentinfo"
      aria-label="Rodapé do site"
    >
      {/* Hairline de gradiente roxo — substitui o separador grosso por um detalhe sutil */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-purple to-transparent" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Marca + social */}
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center">
              <span className="font-brush -skew-x-6 text-2xl tracking-widest">
                <span className="text-brand-purple-light">FLAUTAS</span>
                <span className="text-foreground">BOOST</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Sua plataforma confiável para serviços de boost em jogos competitivos.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://discord.gg/AqhGaTd3r"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-brand-purple hover:border-brand-purple/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </a>
              <TrustpilotBadge size="sm" />
            </div>
          </div>

          {/* Navegação compacta */}
          <nav className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground font-rajdhani">
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <FooterLink href={link.href}>{link.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Barra inferior */}
        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 FlautasBoost. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-rajdhani tracking-wide">
            <span>Feito de gamers para gamers</span>
            <span aria-hidden="true" className="text-border">·</span>
            <span className="tabular-nums">v{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
