import { getEnabledGames, GAMES_CONFIG, getGameConfig } from '@/lib/games-config'

describe('GAMES_CONFIG', () => {
  it('defines at least one game', () => {
    expect(Object.keys(GAMES_CONFIG).length).toBeGreaterThan(0)
  })

  it('every game has required metadata fields', () => {
    Object.entries(GAMES_CONFIG).forEach(([id, config]) => {
      expect(config).toHaveProperty('id', id)
      expect(config).toHaveProperty('displayName')
      expect(config).toHaveProperty('href')
      expect(config).toHaveProperty('enabled')
      expect(config).toHaveProperty('modes')
      expect(Array.isArray(config.modes)).toBe(true)
    })
  })

  it('does NOT contain pricing calculation functions (pricing is DB-driven)', () => {
    Object.values(GAMES_CONFIG).forEach(config => {
      expect(typeof (config as any).calculatePrice).toBe('undefined')
      expect(typeof (config as any).getPrice).toBe('undefined')
    })
  })
})

describe('getEnabledGames', () => {
  it('returns array', () => {
    expect(Array.isArray(getEnabledGames())).toBe(true)
  })

  it('only returns games with enabled=true', () => {
    const enabled = getEnabledGames()
    enabled.forEach(game => {
      expect(game.enabled).toBe(true)
    })
  })
})

describe('getGameConfig', () => {
  it('returns config for a known game', () => {
    const config = getGameConfig('CS2')
    expect(config).toBeDefined()
    expect(config?.id).toBe('CS2')
  })

  it('returns undefined for unknown game', () => {
    expect(getGameConfig('UNKNOWNGAME' as any)).toBeUndefined()
  })
})
