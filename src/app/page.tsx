import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/scan')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-900/20 to-black">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Bottle VIP
          </h1>
          <p className="text-xl text-gray-400">
            Scannez vos tables VIP, collectionnez des bouteilles et grimpez dans les classements
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Link
            href="/login"
            className="block w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="block w-full py-4 px-6 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all border border-gray-700"
          >
            Créer un compte
          </Link>
        </div>

        <div className="pt-8 space-y-4 text-left">
          <h2 className="text-2xl font-semibold text-white">Fonctionnalités</h2>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-center gap-2">
              <span className="text-purple-400">📸</span>
              <span>Scannez vos tables avec l'IA</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-pink-400">🃏</span>
              <span>Collectionnez des cartes de bouteilles</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">🏆</span>
              <span>Classements mondiaux et entre amis</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">👥</span>
              <span>Comparez avec vos amis</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
