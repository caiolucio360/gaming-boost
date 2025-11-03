/**
 * @jest-environment node
 */

import robots from '@/app/robots'

// Mock process.env
const originalEnv = process.env

describe('robots', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('deve gerar robots.txt com regras corretas', () => {
    const result = robots()

    expect(result).toHaveProperty('rules')
    expect(result).toHaveProperty('sitemap')
    expect(Array.isArray(result.rules)).toBe(true)
  })

  it('deve permitir todas as páginas por padrão', () => {
    const result = robots()
    const mainRule = result.rules.find((rule) => rule.userAgent === '*')

    expect(mainRule).toBeDefined()
    expect(mainRule?.allow).toBe('/')
  })

  it('deve bloquear indexação de áreas privadas', () => {
    const result = robots()
    const mainRule = result.rules.find((rule) => rule.userAgent === '*')

    expect(mainRule?.disallow).toContain('/api/')
    expect(mainRule?.disallow).toContain('/admin/')
    expect(mainRule?.disallow).toContain('/dashboard/')
    expect(mainRule?.disallow).toContain('/booster/')
    expect(mainRule?.disallow).toContain('/cart/')
    expect(mainRule?.disallow).toContain('/payment/')
    expect(mainRule?.disallow).toContain('/profile/')
  })

  it('deve referenciar sitemap', () => {
    const result = robots()

    expect(result.sitemap).toBeDefined()
    expect(result.sitemap).toContain('/sitemap.xml')
  })

  it('deve usar URL base padrão quando NEXT_PUBLIC_SITE_URL não estiver definida', () => {
    const result = robots()

    expect(result.sitemap).toContain('https://gameboostpro.com.br')
  })

  it('deve usar NEXT_PUBLIC_SITE_URL quando definida', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://teste.com.br'

    const result = robots()

    expect(result.sitemap).toContain('https://teste.com.br')
  })
})

