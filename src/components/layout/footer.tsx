import Link from 'next/link'
import { GamepadIcon } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-black text-white py-12 border-t border-purple-600">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-purple-600 rounded-lg">
                <GamepadIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                GameBoost Pro
              </span>
            </div>
            <p className="text-gray-400">
              Sua plataforma confiável para serviços de boost em jogos competitivos.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-purple-400">Jogos</h3>
            <ul className="space-y-2">
              <li><Link href="/games/lol" className="text-gray-400 hover:text-purple-400 transition-colors">League of Legends</Link></li>
              <li><Link href="/games/valorant" className="text-gray-400 hover:text-purple-400 transition-colors">Valorant</Link></li>
              <li><Link href="/games/cs2" className="text-gray-400 hover:text-purple-400 transition-colors">Counter-Strike 2</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-purple-400">Serviços</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Boost de Rank</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Coaching</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Placement Matches</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-purple-400">Suporte</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Central de Ajuda</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Contato</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-purple-600 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 GameBoost Pro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}