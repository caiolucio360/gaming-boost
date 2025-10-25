'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CS2Calculator() {
  const [currentRating, setCurrentRating] = useState('')
  const [targetRating, setTargetRating] = useState('')
  const [price, setPrice] = useState(0)
  const [selectedCurrent, setSelectedCurrent] = useState('')
  const [selectedTarget, setSelectedTarget] = useState('')

  const ratingPoints = [
    { value: 1000, color: 'bg-gray-500 border-gray-400' },
    { value: 2000, color: 'bg-gray-500 border-gray-400' },
    { value: 3000, color: 'bg-gray-500 border-gray-400' },
    { value: 4000, color: 'bg-gray-500 border-gray-400' },
    { value: 5000, color: 'bg-blue-400 border-blue-300' },
    { value: 6000, color: 'bg-blue-400 border-blue-300' },
    { value: 7000, color: 'bg-blue-400 border-blue-300' },
    { value: 8000, color: 'bg-blue-400 border-blue-300' },
    { value: 9000, color: 'bg-blue-400 border-blue-300' },
    { value: 10000, color: 'bg-blue-400 border-blue-300' },
    { value: 11000, color: 'bg-blue-600 border-blue-500' },
    { value: 12000, color: 'bg-blue-600 border-blue-500' },
    { value: 13000, color: 'bg-blue-600 border-blue-500' },
    { value: 14000, color: 'bg-blue-600 border-blue-500' },
    { value: 15000, color: 'bg-blue-600 border-blue-500' },
    { value: 16000, color: 'bg-purple-600 border-purple-500' },
    { value: 17000, color: 'bg-purple-600 border-purple-500' },
    { value: 18000, color: 'bg-purple-600 border-purple-500' },
    { value: 19000, color: 'bg-purple-600 border-purple-500' },
    { value: 20000, color: 'bg-purple-600 border-purple-500' },
    { value: 21000, color: 'bg-purple-600 border-purple-500' },
    { value: 22000, color: 'bg-purple-600 border-purple-500' },
    { value: 23000, color: 'bg-purple-600 border-purple-500' },
    { value: 24000, color: 'bg-purple-600 border-purple-500' },
    { value: 25000, color: 'bg-purple-600 border-purple-500' },
    { value: 26000, color: 'bg-red-500 border-red-400' }
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

    const ratingDifference = target - current
    const basePrice = Math.ceil(ratingDifference / 1000) * 50 // R$ 50 a cada 1000 pontos
    setPrice(basePrice)
  }

  const handleCurrentSelect = (value: number) => {
    setSelectedCurrent(value.toString())
    setCurrentRating(value.toString())
  }

  const handleTargetSelect = (value: number) => {
    setSelectedTarget(value.toString())
    setTargetRating(value.toString())
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-white font-orbitron mb-4 text-center" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
          <span className="text-purple-300">CS2 PREMIER</span>
          <span className="text-white"> CALCULATOR</span>
        </h2>
        
        <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-purple-300 font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
            Sistema CS Rating:
          </h3>
          <div className="text-sm text-gray-300 font-rajdhani space-y-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
            <p><span className="text-purple-300">• Pontuação:</span> 0 a 40.000+ pontos</p>
            <p><span className="text-purple-300">• Faixas:</span> 7 faixas de cores baseadas na pontuação</p>
            <p><span className="text-purple-300">• Preço:</span> R$ 50 a cada 1000 pontos de diferença</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Seleção de Pontuações - Lado a Lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pontuação Atual */}
            <div>
              <h3 className="text-xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                PONTUAÇÃO ATUAL:
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {ratingPoints.map((point) => (
                  <button
                    key={point.value}
                    onClick={() => handleCurrentSelect(point.value)}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      selectedCurrent === point.value.toString()
                        ? 'ring-4 ring-yellow-400 ring-opacity-90 shadow-lg shadow-yellow-400/60 scale-105 bg-yellow-500/90'
                        : 'hover:ring-2 hover:ring-purple-300 hover:ring-opacity-40'
                    } ${point.color}`}
                  >
                    <span className="text-white font-bold font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      {point.value / 1000}K
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pontuação Desejada */}
            <div>
              <h3 className="text-xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                PONTUAÇÃO DESEJADA:
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {ratingPoints.map((point) => (
                  <button
                    key={point.value}
                    onClick={() => handleTargetSelect(point.value)}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      selectedTarget === point.value.toString()
                        ? 'ring-4 ring-yellow-400 ring-opacity-90 shadow-lg shadow-yellow-400/60 scale-105 bg-yellow-500/90'
                        : 'hover:ring-2 hover:ring-purple-300 hover:ring-opacity-40'
                    } ${point.color}`}
                  >
                    <span className="text-white font-bold font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      {point.value / 1000}K
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
                    {selectedCurrent}K → {selectedTarget}K pontos
                  </p>
                  <Button className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30">
                    CONTRATAR AGORA
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Selecione as pontuações para calcular o preço
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
