import { ApplyForm } from '@/components/booster/apply-form'

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white font-orbitron mb-4">
          Junte-se à Elite
        </h1>
        <p className="text-xl text-gray-400 font-rajdhani">
          Ganhe dinheiro jogando o que você ama.
        </p>
      </div>
      <ApplyForm />
    </div>
  )
}
