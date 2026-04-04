import robots from '@/app/robots'

describe('robots', () => {
  const config = robots()

  it('has rules defined', () => {
    expect(Array.isArray(config.rules)).toBe(true)
    expect(config.rules.length).toBeGreaterThan(0)
  })

  it('points sitemap to correct URL', () => {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'
    expect(config.sitemap).toBe(`${base}/sitemap.xml`)
  })

  it('allows public pages', () => {
    const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules
    expect(rule.allow).toContain('/')
  })

  it('disallows sensitive routes', () => {
    const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
    expect(disallow.some(d => d?.includes('/api/'))).toBe(true)
    expect(disallow.some(d => d?.includes('/admin/'))).toBe(true)
    expect(disallow.some(d => d?.includes('/dashboard/'))).toBe(true)
  })
})
