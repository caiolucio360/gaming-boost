import {
  getGameConfig,
  getEnabledGames,
  isGameEnabled,
  isServiceTypeSupported,
  GAMES_CONFIG,
  GameId,
  ServiceType,
} from '@/lib/games-config'

describe('games-config', () => {
  describe('getGameConfig', () => {
    it('deve retornar configuração do jogo CS2', () => {
      const config = getGameConfig('CS2')
      expect(config).toBeDefined()
      expect(config?.id).toBe('CS2')
      expect(config?.name).toBe('Counter-Strike 2')
      expect(config?.enabled).toBe(true)
    })

    it('deve retornar undefined para jogo inexistente', () => {
      const config = getGameConfig('INEXISTENTE' as GameId)
      expect(config).toBeUndefined()
    })
  })

  describe('getEnabledGames', () => {
    it('deve retornar apenas jogos habilitados', () => {
      const games = getEnabledGames()
      expect(games).toBeDefined()
      expect(Array.isArray(games)).toBe(true)
      games.forEach((game) => {
        expect(game.enabled).toBe(true)
      })
    })

    it('deve incluir CS2 se estiver habilitado', () => {
      const games = getEnabledGames()
      const cs2Game = games.find((g) => g.id === 'CS2')
      if (GAMES_CONFIG.CS2?.enabled) {
        expect(cs2Game).toBeDefined()
        expect(cs2Game?.id).toBe('CS2')
      }
    })
  })

  describe('isGameEnabled', () => {
    it('deve retornar true para CS2 se estiver habilitado', () => {
      const enabled = isGameEnabled('CS2')
      expect(enabled).toBe(true)
    })

    it('deve retornar false para jogo inexistente', () => {
      const enabled = isGameEnabled('INEXISTENTE' as GameId)
      expect(enabled).toBe(false)
    })
  })

  describe('isServiceTypeSupported', () => {
    it('deve retornar true para RANK_BOOST em CS2', () => {
      const supported = isServiceTypeSupported('CS2', 'RANK_BOOST')
      expect(supported).toBe(true)
    })

    it('deve retornar false para tipo de serviço não suportado', () => {
      const supported = isServiceTypeSupported('CS2', 'COACHING')
      expect(supported).toBe(false)
    })

    it('deve retornar false para jogo inexistente', () => {
      const supported = isServiceTypeSupported('INEXISTENTE' as GameId, 'RANK_BOOST')
      expect(supported).toBe(false)
    })
  })

  describe('GAMES_CONFIG', () => {
    it('deve ter configuração para CS2', () => {
      expect(GAMES_CONFIG.CS2).toBeDefined()
      expect(GAMES_CONFIG.CS2?.id).toBe('CS2')
      expect(GAMES_CONFIG.CS2?.enabled).toBe(true)
    })

    it('deve ter modos PREMIER e GAMERS_CLUB para CS2', () => {
      const cs2Config = GAMES_CONFIG.CS2
      expect(cs2Config?.modes).toBeDefined()
      expect(cs2Config?.modes?.PREMIER).toBeDefined()
      expect(cs2Config?.modes?.GAMERS_CLUB).toBeDefined()
      expect(cs2Config?.modes?.PREMIER.id).toBe('PREMIER')
      expect(cs2Config?.modes?.GAMERS_CLUB.id).toBe('GAMERS_CLUB')
    })

    it('deve ter pricingRules para modos', () => {
      const cs2Config = GAMES_CONFIG.CS2
      expect(cs2Config?.modes?.PREMIER?.pricingRules).toBeDefined()
      expect(cs2Config?.modes?.GAMERS_CLUB?.pricingRules).toBeDefined()
      expect(cs2Config?.modes?.PREMIER?.pricingRules.basePrice).toBe(50)
      expect(cs2Config?.modes?.GAMERS_CLUB?.pricingRules.basePrice).toBe(45)
    })

    it('deve ter ratingPoints ou ranks para cada modo', () => {
      const cs2Config = GAMES_CONFIG.CS2
      expect(cs2Config?.modes?.PREMIER?.ratingPoints).toBeDefined()
      expect(Array.isArray(cs2Config?.modes?.PREMIER?.ratingPoints)).toBe(true)
      
      expect(cs2Config?.modes?.GAMERS_CLUB?.ranks).toBeDefined()
      expect(Array.isArray(cs2Config?.modes?.GAMERS_CLUB?.ranks)).toBe(true)
    })
  })
})

