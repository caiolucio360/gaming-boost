import sitemap from '@/app/sitemap'

describe('sitemap', () => {
  const urls = sitemap().map(entry => entry.url)
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'

  it('includes homepage', () => {
    expect(urls).toContain(base)
  })

  it('includes /games/cs2', () => {
    expect(urls).toContain(`${base}/games/cs2`)
  })

  it('includes /games/cs2/pricing', () => {
    expect(urls).toContain(`${base}/games/cs2/pricing`)
  })

  it('includes /privacy and /terms', () => {
    expect(urls).toContain(`${base}/privacy`)
    expect(urls).toContain(`${base}/terms`)
  })

  it('does NOT include /contact (removed in MVP)', () => {
    expect(urls).not.toContain(`${base}/contact`)
  })

  it('does NOT include protected routes', () => {
    const protected_routes = ['/admin', '/dashboard', '/booster', '/cart', '/payment', '/profile']
    protected_routes.forEach(route => {
      expect(urls).not.toContain(`${base}${route}`)
    })
  })

  it('all entries have required fields', () => {
    sitemap().forEach(entry => {
      expect(entry).toHaveProperty('url')
      expect(entry).toHaveProperty('lastModified')
      expect(entry).toHaveProperty('changeFrequency')
      expect(entry).toHaveProperty('priority')
    })
  })
})
