import { ApplyForm } from '@/components/booster/apply-form'

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
          <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">Junte-se</span>
          <span className="text-white"> à Elite</span>
        </h1>
        <p className="text-xl text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
          Ganhe dinheiro jogando o que você ama.
        </p>
      </div>
      <div>
        <ApplyForm />
      </div>
    </div>
  )
}
