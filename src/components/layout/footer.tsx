import Link from 'next/link'
import { GamepadIcon } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <GamepadIcon className="h-6 w-6" />
              <span className="text-xl font-bold">GameBoost Pro</span>
            </div>
            <p className="text-gray-400">
              Sua plataforma confiável para serviços de boost em jogos competitivos.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Jogos</h3>
            <ul className="space-y-2">
              <li><Link href="/games/lol" className="text-gray-400 hover:text-white">League of Legends</Link></li>
              <li><Link href="/games/valorant" className="text-gray-400 hover:text-white">Valorant</Link></li>
              <li><Link href="/games/cs2" className="text-gray-400 hover:text-white">Counter-Strike 2</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Serviços</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-white">Boost de Rank</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Coaching</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-white">Central de Ajuda</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Contato</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 GameBoost Pro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}