'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function GamersClubCalculator() {
  const [currentLevel, setCurrentLevel] = useState('')
  const [targetLevel, setTargetLevel] = useState('')
  const [price, setPrice] = useState(0)
  const [selectedCurrent, setSelectedCurrent] = useState('')
  const [selectedTarget, setSelectedTarget] = useState('')

  const levelData = [
    // Níveis 1-5: Purple diamond
    { level: 1, color: 'bg-purple-600 border-purple-500', shape: 'diamond' },
    { level: 2, color: 'bg-purple-600 border-purple-500', shape: 'diamond' },
    { level: 3, color: 'bg-purple-600 border-purple-500', shape: 'diamond' },
    { level: 4, color: 'bg-purple-600 border-purple-500', shape: 'diamond' },
    { level: 5, color: 'bg-purple-600 border-purple-500', shape: 'diamond' },
    // Níveis 6-10: Blue pentagon
    { level: 6, color: 'bg-blue-500 border-blue-400', shape: 'pentagon' },
    { level: 7, color: 'bg-blue-500 border-blue-400', shape: 'pentagon' },
    { level: 8, color: 'bg-blue-500 border-blue-400', shape: 'pentagon' },
    { level: 9, color: 'bg-blue-500 border-blue-400', shape: 'pentagon' },
    { level: 10, color: 'bg-blue-500 border-blue-400', shape: 'pentagon' },
    // Níveis 11-15: Green hexagon
    { level: 11, color: 'bg-green-500 border-green-400', shape: 'hexagon' },
    { level: 12, color: 'bg-green-500 border-green-400', shape: 'hexagon' },
    { level: 13, color: 'bg-green-500 border-green-400', shape: 'hexagon' },
    { level: 14, color: 'bg-green-500 border-green-400', shape: 'hexagon' },
    { level: 15, color: 'bg-green-500 border-green-400', shape: 'hexagon' },
    // Níveis 16-19: Orange hexagon
    { level: 16, color: 'bg-orange-500 border-orange-400', shape: 'hexagon' },
    { level: 17, color: 'bg-orange-500 border-orange-400', shape: 'hexagon' },
    { level: 18, color: 'bg-orange-500 border-orange-400', shape: 'hexagon' },
    { level: 19, color: 'bg-orange-500 border-orange-400', shape: 'hexagon' },
    // Nível 20: Red hexagon
    { level: 20, color: 'bg-red-500 border-red-400', shape: 'hexagon' }
  ]

  const calculatePrice = () => {
    if (!selectedCurrent || !selectedTarget) {
      setPrice(0)
      return
    }

    const current = parseInt(selectedCurrent)
    const target = parseInt(selectedTarget)

    if (current >= target) {
      setPrice(0)
      return
    }

    const levelDifference = target - current
    const basePrice = levelDifference * 25 // R$ 25 por nível
    setPrice(basePrice)
  }

  const handleCurrentSelect = (level: number) => {
    setSelectedCurrent(level.toString())
    setCurrentLevel(level.toString())
  }

  const handleTargetSelect = (level: number) => {
    setSelectedTarget(level.toString())
    setTargetLevel(level.toString())
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-white font-orbitron mb-4 text-center" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
          <span className="text-purple-300">GAMERS CLUB</span>
          <span className="text-white"> CALCULATOR</span>
        </h2>
        
        <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-purple-300 font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
            Gamers Club:
          </h3>
          <div className="text-sm text-gray-300 font-rajdhani space-y-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
            <p><span className="text-purple-300">• Sistema de Níveis:</span> 20 níveis de progressão</p>
            <p><span className="text-purple-300">• Cores:</span> Roxo (1-5), Azul (6-10), Verde (11-15), Laranja (16-19), Vermelho (20)</p>
            <p><span className="text-purple-300">• Preço:</span> R$ 25 por nível de diferença</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Seleção de Níveis - Lado a Lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Nível Atual */}
            <div>
              <h3 className="text-xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                NÍVEL ATUAL:
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {levelData.map((levelInfo) => (
                  <button
                    key={levelInfo.level}
                    onClick={() => handleCurrentSelect(levelInfo.level)}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      selectedCurrent === levelInfo.level.toString()
                        ? 'ring-4 ring-yellow-400 ring-opacity-90 shadow-lg shadow-yellow-400/60 scale-105 bg-yellow-500/90'
                        : 'hover:ring-2 hover:ring-purple-300 hover:ring-opacity-40'
                    } ${levelInfo.color}`}
                  >
                    <span className="text-white font-bold font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      {levelInfo.level}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nível Desejado */}
            <div>
              <h3 className="text-xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                NÍVEL DESEJADO:
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {levelData.map((levelInfo) => (
                  <button
                    key={levelInfo.level}
                    onClick={() => handleTargetSelect(levelInfo.level)}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      selectedTarget === levelInfo.level.toString()
                        ? 'ring-4 ring-yellow-400 ring-opacity-90 shadow-lg shadow-yellow-400/60 scale-105 bg-yellow-500/90'
                        : 'hover:ring-2 hover:ring-purple-300 hover:ring-opacity-40'
                    } ${levelInfo.color}`}
                  >
                    <span className="text-white font-bold font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      {levelInfo.level}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botão de Cálculo e Resultado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Botão de Cálculo */}
            <div className="flex justify-center lg:justify-start">
              <Button
                onClick={calculatePrice}
                className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
              >
                CALCULAR PREÇO
              </Button>
            </div>

            {/* Resultado do Preço */}
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                <span className="text-purple-300">PREÇO</span>
                <span className="text-white"> ESTIMADO</span>
              </h3>
              
              {price > 0 ? (
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-300 font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
                    R$ {price.toFixed(2)}
                  </div>
                  <p className="text-gray-300 font-rajdhani mb-4" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                    Nível {selectedCurrent} → Nível {selectedTarget}
                  </p>
                  <Button className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30">
                    CONTRATAR AGORA
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Selecione os níveis para calcular o preço
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
