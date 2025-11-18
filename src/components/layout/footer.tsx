import Link from 'next/link'

export function Footer() {
  return (
    <footer className="relative bg-black text-white py-8 md:py-12 border-t border-purple-600 z-0">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 md:mb-4">
              <h1 className="text-xl md:text-3xl font-black text-white drop-shadow-2xl font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
                <span className="text-purple-300 drop-shadow-2xl">GAME</span>
                <span className="text-white drop-shadow-2xl">BOOST</span>
              </h1>
            </div>
            <p className="text-xs md:text-sm text-gray-400">
              Sua plataforma confiável para serviços de boost em jogos competitivos.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 md:mb-4 text-purple-400 text-sm md:text-base">Jogos</h3>
            <ul className="space-y-2">
              <li><Link href="/games/cs2" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">Counter-Strike 2</Link></li>
              <li><span className="text-xs md:text-sm text-gray-500">League of Legends <span className="text-xs text-purple-400 font-semibold">(em breve)</span></span></li>
              <li><span className="text-xs md:text-sm text-gray-500">Valorant <span className="text-xs text-purple-400 font-semibold">(em breve)</span></span></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 md:mb-4 text-purple-400 text-sm md:text-base">Serviços</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">Boost de Rank</Link></li>
              <li><span className="text-xs md:text-sm text-gray-500">Coaching <span className="text-xs text-purple-400 font-semibold">(em breve)</span></span></li>
            </ul>
          </div>
          
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold mb-3 md:mb-4 text-purple-400 text-sm md:text-base">Suporte</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">Contato</Link></li>
              <li><Link href="/terms" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">Termos de Uso</Link></li>
              <li><Link href="/privacy" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">Política de Privacidade</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-purple-600 mt-6 md:mt-8 pt-6 md:pt-8 text-center">
          <p className="text-xs md:text-sm text-gray-400">
            © 2025 GameBoost Pro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}