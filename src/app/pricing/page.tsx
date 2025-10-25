'use client'

import { useState } from 'react'
import { CS2Calculator } from '@/components/cs2-calculator'
import { GamersClubCalculator } from '@/components/gamersclub-calculator'

export default function PricingPage() {
  const [selectedService, setSelectedService] = useState('cs2')

  const services = [
    { value: 'cs2', label: 'CS2 Premier', description: 'Sistema CS Rating com pontuações' },
    { value: 'gamersclub', label: 'Gamers Club', description: 'Sistema de níveis 1-20' }
  ]

  const renderCalculator = () => {
    switch (selectedService) {
      case 'cs2':
        return <CS2Calculator />
      case 'gamersclub':
        return <GamersClubCalculator />
      default:
        return <CS2Calculator />
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-32">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">CALCULADORA</span>
            <span className="text-white"> DE PREÇOS</span>
          </h1>
          <p className="text-xl text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Calcule o preço do seu boost
          </p>
        </div>

        {/* Seleção de Serviços */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <button
                key={service.value}
                onClick={() => setSelectedService(service.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  selectedService === service.value
                    ? 'bg-purple-500/20 border-purple-400 text-white'
                    : 'bg-black/30 border-purple-500/50 text-gray-300 hover:border-purple-400 hover:text-white'
                }`}
              >
                <h3 className="text-lg font-bold font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  {service.label}
                </h3>
                <p className="text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  {service.description}
                </p>
              </button>
            ))}
          </div>
        </div>
        
        {renderCalculator()}
      </div>
    </div>
  )
}
