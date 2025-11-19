import { generateMetadata, SEOConfig } from '@/lib/seo'
import { Metadata } from 'next'

// Mock process.env
const originalEnv = process.env

describe('seo', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('generateMetadata', () => {
    it('deve gerar metadata básica corretamente', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
      }

      const metadata = generateMetadata(config)

      expect(metadata.title).toBe('Teste | GameBoost Pro')
      expect(metadata.description).toBe('Descrição de teste')
      expect(metadata.keywords).toBeUndefined()
    })

    it('deve incluir keywords quando fornecidas', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
        keywords: ['keyword1', 'keyword2', 'keyword3'],
      }

      const metadata = generateMetadata(config)

      expect(metadata.keywords).toBe('keyword1, keyword2, keyword3')
    })

    it('deve gerar Open Graph tags corretamente', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
      }

      const metadata = generateMetadata(config)

      expect(metadata.openGraph).toBeDefined()
      expect(metadata.openGraph?.title).toBe('Teste | GameBoost Pro')
      expect(metadata.openGraph?.description).toBe('Descrição de teste')
      expect(metadata.openGraph?.type).toBe('website')
      expect(metadata.openGraph?.locale).toBe('pt_BR')
      expect(metadata.openGraph?.siteName).toBe('GameBoost Pro')
    })

    it('deve gerar Twitter Cards corretamente', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
      }

      const metadata = generateMetadata(config)

      expect(metadata.twitter).toBeDefined()
      expect(metadata.twitter?.card).toBe('summary_large_image')
      expect(metadata.twitter?.title).toBe('Teste | GameBoost Pro')
      expect(metadata.twitter?.description).toBe('Descrição de teste')
    })

    it('deve usar URL base padrão quando NEXT_PUBLIC_SITE_URL não estiver definida', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
      }

      const metadata = generateMetadata(config)

      expect(metadata.metadataBase).toEqual(new URL('https://gameboostpro.com.br'))
    })

    it('deve usar NEXT_PUBLIC_SITE_URL quando definida', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://teste.com.br'

      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
      }

      const metadata = generateMetadata(config)

      expect(metadata.metadataBase).toEqual(new URL('https://teste.com.br'))
    })

    it('deve usar canonical URL quando fornecida', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
        canonical: 'https://teste.com.br/teste',
      }

      const metadata = generateMetadata(config)

      expect(metadata.alternates?.canonical).toBe('https://teste.com.br/teste')
    })

    it('deve usar imagem personalizada quando fornecida', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
        ogImage: '/custom-image.png',
      }

      const metadata = generateMetadata(config)

      expect(metadata.openGraph?.images?.[0]?.url).toContain('/custom-image.png')
    })

    it('deve usar imagem absoluta quando fornecida URL completa', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
        ogImage: 'https://example.com/image.png',
      }

      const metadata = generateMetadata(config)

      expect(metadata.openGraph?.images?.[0]?.url).toBe('https://example.com/image.png')
    })

    it('deve definir noindex quando configurado', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
        noindex: true,
      }

      const metadata = generateMetadata(config)

      expect(metadata.robots).toBe('noindex, nofollow')
    })

    it('deve definir index quando noindex for false', () => {
      const config: SEOConfig = {
        title: 'Teste',
        description: 'Descrição de teste',
        noindex: false,
      }

      const metadata = generateMetadata(config)

      expect(metadata.robots).toBe('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    })
  })
})

