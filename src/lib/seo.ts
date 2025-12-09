import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  canonical?: string
  noindex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}

const DEFAULT_SITE_URL = 'https://gaming-boost.vercel.app'
const DEFAULT_OG_IMAGE = '/principal.png'

export function generateMetadata({
  title,
  description,
  keywords = [],
  ogImage = DEFAULT_OG_IMAGE,
  canonical,
  noindex = false,
  type = 'website',
  publishedTime,
  modifiedTime,
}: SEOConfig): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
  const fullTitle = title.includes('GameBoost') ? title : `${title} | GameBoost`
  const fullImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`
  const canonicalUrl = canonical || siteUrl

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    authors: [{ name: 'GameBoost' }],
    creator: 'GameBoost',
    publisher: 'GameBoost',
    robots: noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    openGraph: {
      type,
      locale: 'pt_BR',
      url: canonicalUrl,
      siteName: 'GameBoost',
      title: fullTitle,
      description,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullImage],
      creator: '@gameboostpro',
      site: '@gameboostpro',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    metadataBase: new URL(siteUrl),
    category: 'Gaming Services',
    classification: 'Gaming Boost Services',
  }

  return metadata
}

