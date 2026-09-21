'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface LeaderboardEntry {
  user_id: string
  username: string | null
  total_spent: number
  month?: string
  year?: string
  region: string
  country: string
  city: string
  rank?: number
}

export default function LeaderboardsPage() {
  const [period, setPeriod] = useState<'monthly' | 'yearly' | 'biggest'>('monthly')
  const [region, setRegion] = useState<'all' | 'france' | 'europe' | 'asie' | 'ameriques'>('all')
  const [scope, setScope] = useState<'global' | 'friends'>('global')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadLeaderboard()
  }, [period, region, scope])

  const loadLeaderboard = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    let viewName = ''
    if (period === 'monthly') viewName = 'leaderboard_spending_monthly'
    else if (period === 'yearly') viewName = 'leaderboard_spending_yearly'
    else viewName = 'leaderboard_biggest_outing'

    let query = supabase.from(viewName).select('*')

    // Apply region filter
    if (region !== 'all') {
      query = query.eq('region', region)
    }

    // For friends scope, we need to filter by friendships
    if (scope === 'friends') {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      const friendIds = friendships?.map(f => f.friend_id) || []
      friendIds.push(user.id) // Include current user

      if (friendIds.length > 0) {
        query = query.in('user_id', friendIds)
      }
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('Leaderboard error:', error)
      setLeaderboard([])
    } else {
      // Add rank
      const rankedData = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))
      setLeaderboard(rankedData)

      // Find current user rank
      const userEntry = rankedData.find(e => e.user_id === user.id)
      setCurrentUserRank(userEntry?.rank || null)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Classements</h1>
          <button
            onClick={() => router.push('/scan')}
            className="text-gray-400 hover:text-white"
          >
            Scanner
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700 space-y-4">
          {/* Period Filter */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Période</label>
            <div className="flex gap-2">
              {[
                { value: 'monthly', label: 'Mensuel' },
                { value: 'yearly', label: 'Annuel' },
                { value: 'biggest', label: 'Plus grosse table' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value as any)}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    period === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region Filter */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Région</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Monde' },
                { value: 'france', label: 'France' },
                { value: 'europe', label: 'Europe' },
                { value: 'asie', label: 'Asie' },
                { value: 'ameriques', label: 'Amériques' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setRegion(option.value as any)}
                  className={`py-2 px-4 rounded-lg transition-colors ${
                    region === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Filter */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Portée</label>
            <div className="flex gap-2">
              {[
                { value: 'global', label: 'Global' },
                { value: 'friends', label: 'Amis' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setScope(option.value as any)}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    scope === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current User Rank */}
        {currentUserRank && (
          <div className="bg-purple-900/30 backdrop-blur rounded-xl p-4 border border-purple-500/50">
            <p className="text-purple-400 font-medium">
              Votre rang : <span className="text-white text-2xl">#{currentUserRank}</span>
            </p>
          </div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 text-center">
            <p className="text-gray-400">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <LeaderboardItem key={entry.user_id} entry={entry} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Rarity Leaderboard */}
        <RarityLeaderboard scope={scope} />
      </div>
    </div>
  )
}

function LeaderboardItem({ entry, index }: { entry: LeaderboardEntry, index: number }) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-amber-600'
    return 'text-gray-400'
  }

  const getRankBackground = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/50'
    if (rank === 2) return 'bg-gray-400/20 border-gray-400/50'
    if (rank === 3) return 'bg-amber-600/20 border-amber-600/50'
    return 'bg-gray-700/30 border-gray-700'
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${getRankBackground(entry.rank || index + 1)}`}
    >
      <div className="flex items-center gap-4">
        <span className={`text-2xl font-bold w-8 ${getRankColor(entry.rank || index + 1)}`}>
          {entry.rank || index + 1}
        </span>
        <div>
          <p className="text-white font-medium">{entry.username || 'Anonyme'}</p>
          <p className="text-sm text-gray-400">{entry.city}, {entry.country}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold text-purple-400">
          {formatCurrency(entry.total_spent, 'EUR')}
        </p>
        {entry.month && (
          <p className="text-xs text-gray-500">
            {new Date(entry.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        )}
        {entry.year && (
          <p className="text-xs text-gray-500">{entry.year}</p>
        )}
      </div>
    </div>
  )
}

function RarityLeaderboard({ scope }: { scope: 'global' | 'friends' }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRarityLeaderboard()
  }, [scope])

  const loadRarityLeaderboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase.from('leaderboard_rarity_score').select('*')

    if (scope === 'friends') {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      const friendIds = friendships?.map(f => f.friend_id) || []
      friendIds.push(user.id)

      if (friendIds.length > 0) {
        query = query.in('user_id', friendIds)
      }
    }

    const { data } = await query.limit(50)
    setLeaderboard(data || [])
    setLoading(false)
  }

  if (loading) return null

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">🏆 Classement Rareté</h2>
      <div className="space-y-2">
        {leaderboard.slice(0, 10).map((entry, index) => (
          <div
            key={entry.user_id}
            className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold w-6 ${
                index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-400'
              }`}>
                {index + 1}
              </span>
              <div>
                <p className="text-white font-medium">{entry.username || 'Anonyme'}</p>
                <p className="text-xs text-gray-400">
                  {entry.rare_count} rares • {entry.epic_count} épiques • {entry.legendary_count} légendaires
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-purple-400">{entry.rarity_score}</p>
              <p className="text-xs text-gray-500">Points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
