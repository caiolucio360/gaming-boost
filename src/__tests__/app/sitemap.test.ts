/**
 * @jest-environment node
 */

import sitemap from '@/app/sitemap'

// Mock process.env
const originalEnv = process.env

describe('sitemap', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('deve gerar sitemap com URLs corretas', () => {
    const result = sitemap()

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    
    // Verificar estrutura básica
    result.forEach((entry) => {
      expect(entry).toHaveProperty('url')
      expect(entry).toHaveProperty('lastModified')
      expect(entry).toHaveProperty('changeFrequency')
      expect(entry).toHaveProperty('priority')
    })
  })

  it('deve incluir página inicial', () => {
    const result = sitemap()
    // A URL pode terminar com '/' ou não, dependendo do baseUrl
    const homePage = result.find((entry) => entry.url === 'https://gameboostpro.com.br' || entry.url === 'https://gameboostpro.com.br/')

    expect(homePage).toBeDefined()
    expect(homePage?.priority).toBe(1)
  })

  it('deve incluir páginas principais', () => {
    const result = sitemap()
    const urls = result.map((entry) => entry.url)

    expect(urls.some((url) => url.includes('/services'))).toBe(true)
    expect(urls.some((url) => url.includes('/games/cs2'))).toBe(true)
    expect(urls.some((url) => url.includes('/about'))).toBe(true)
    expect(urls.some((url) => url.includes('/contact'))).toBe(true)
  })

  it('deve usar URL base padrão quando NEXT_PUBLIC_SITE_URL não estiver definida', () => {
    const result = sitemap()

    result.forEach((entry) => {
      expect(entry.url).toContain('https://gameboostpro.com.br')
    })
  })

  it('deve usar NEXT_PUBLIC_SITE_URL quando definida', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://teste.com.br'

    const result = sitemap()

    result.forEach((entry) => {
      expect(entry.url).toContain('https://teste.com.br')
    })
  })

  it('deve ter prioridades corretas', () => {
    const result = sitemap()

    const homePage = result.find((entry) => entry.url === 'https://gameboostpro.com.br' || entry.url === 'https://gameboostpro.com.br/')
    expect(homePage?.priority).toBe(1)

    const servicePage = result.find((entry) => entry.url.includes('/services'))
    expect(servicePage?.priority).toBeGreaterThan(0)
    expect(servicePage?.priority).toBeLessThanOrEqual(1)
  })
})

