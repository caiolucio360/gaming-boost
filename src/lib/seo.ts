import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  canonical?: string
  noindex?: boolean
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  ogImage = '/principal.png',
  canonical,
  noindex = false,
}: SEOConfig): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'
  const fullTitle = `${title} | GameBoost Pro`
  const fullImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    authors: [{ name: 'GameBoost Pro' }],
    creator: 'GameBoost Pro',
    publisher: 'GameBoost Pro',
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: canonical || siteUrl,
      siteName: 'GameBoost Pro',
      title: fullTitle,
      description,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullImage],
      creator: '@gameboostpro',
    },
    alternates: {
      canonical: canonical || siteUrl,
    },
    metadataBase: new URL(siteUrl),
  }
}

