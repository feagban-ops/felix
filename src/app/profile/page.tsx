import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, getXPProgress } from '@/lib/utils'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/signup')
  }

  const xpProgress = getXPProgress(profile.xp)

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Mon Profil</h1>
          <Link
            href="/scan"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Scanner
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
              {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{profile.username || 'Anonyme'}</h2>
              <p className="text-gray-400">Niveau {profile.level}</p>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>XP: {profile.xp}</span>
              <span>Niveau suivant: {xpProgress.target} XP</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${xpProgress.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Total dépensé</p>
            <p className="text-2xl font-bold text-white mt-1">-</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">Tables scannées</p>
            <p className="text-2xl font-bold text-white mt-1">-</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Link
            href="/collection"
            className="block w-full py-4 px-6 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            🃏 Ma collection
          </Link>
          <Link
            href="/friends"
            className="block w-full py-4 px-6 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            👥 Mes amis
          </Link>
          <Link
            href="/leaderboards"
            className="block w-full py-4 px-6 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            🏆 Classements
          </Link>
        </div>

        {/* Settings */}
        <div className="space-y-3 pt-4 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-white">Paramètres</h3>
          <Link
            href="/profile/settings"
            className="block w-full py-4 px-6 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            ⚙️ Paramètres du compte
          </Link>
          <Link
            href="/profile/export"
            className="block w-full py-4 px-6 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            📥 Exporter mes données (RGPD)
          </Link>
        </div>
      </div>
    </div>
  )
}
