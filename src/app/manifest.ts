import type { MetadataRoute } from 'next'

// Web App Manifest — emitido como /manifest.webmanifest e linkado automaticamente pelo Next.
// Completa o SEO/PWA (instalação, cor da splash, ícone). Cores alinhadas à marca.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FlautasBoost — Boost de Rank para CS2',
    short_name: 'FlautasBoost',
    description:
      'Subimos seu rank no Counter-Strike 2 com segurança e rapidez. Boosters verificados, entrega garantida.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#7c3aed',
    lang: 'pt-BR',
    categories: ['games', 'entertainment'],
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        src: '/flautas/flautasboost-icone-app.png',
        type: 'image/png',
        sizes: 'any',
        purpose: 'any',
      },
    ],
  }
}
