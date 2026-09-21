'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency, getXPProgress } from '@/lib/utils'
import { getRarityColor, getRarityLabel } from '@/lib/gamification'

export default function FriendComparePage() {
  const { friendId } = useParams()
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<any>(null)
  const [friendProfile, setFriendProfile] = useState<any>(null)
  const [myCards, setMyCards] = useState<any[]>([])
  const [friendCards, setFriendCards] = useState<any[]>([])
  const [myOutings, setMyOutings] = useState<any[]>([])
  const [friendOutings, setFriendOutings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (friendId) {
      loadData()
    }
  }, [friendId])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const [myProfileData, friendProfileData, myCardsData, friendCardsData, myOutingsData, friendOutingsData] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('*').eq('id', friendId).single(),
      supabase.from('cards').select('*, bottles(*)').eq('user_id', user.id),
      supabase.from('cards').select('*, bottles(*)').eq('user_id', friendId),
      supabase.from('outings').select('*, venues(*)').eq('owner_id', user.id),
      supabase.from('outings').select('*, venues(*)').eq('owner_id', friendId),
    ])

    setMyProfile(myProfileData.data)
    setFriendProfile(friendProfileData.data)
    setMyCards(myCardsData.data || [])
    setFriendCards(friendCardsData.data || [])
    setMyOutings(myOutingsData.data || [])
    setFriendOutings(friendOutingsData.data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  if (!myProfile || !friendProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4 flex items-center justify-center">
        <div className="text-white">Profil non trouvé</div>
      </div>
    )
  }

  const myXPProgress = getXPProgress(myProfile.xp)
  const friendXPProgress = getXPProgress(friendProfile.xp)

  const myTotalSpent = myOutings.reduce((sum, o) => sum + (o.total_price || 0), 0)
  const friendTotalSpent = friendOutings.reduce((sum, o) => sum + (o.total_price || 0), 0)

  const myRareCards = myCards.filter(c => c.bottles.rarity_tier !== 'commune').length
  const friendRareCards = friendCards.filter(c => c.bottles.rarity_tier !== 'commune').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-white">Comparaison</h1>
        </div>

        {/* Profile Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-purple-500/50">
            <h2 className="text-xl font-semibold text-purple-400 mb-4">Vous</h2>
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white mx-auto">
                {myProfile.username?.[0]?.toUpperCase() || '?'}
              </div>
              <p className="text-white font-medium mt-2">{myProfile.username}</p>
              <p className="text-gray-400">Niveau {myProfile.level}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">XP</span>
                <span className="text-white">{myProfile.xp}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${myXPProgress.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-pink-500/50">
            <h2 className="text-xl font-semibold text-pink-400 mb-4">{friendProfile.username}</h2>
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white mx-auto">
                {friendProfile.username?.[0]?.toUpperCase() || '?'}
              </div>
              <p className="text-white font-medium mt-2">{friendProfile.username}</p>
              <p className="text-gray-400">Niveau {friendProfile.level}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">XP</span>
                <span className="text-white">{friendProfile.xp}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full"
                  style={{ width: `${friendXPProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Statistiques</h2>
          <div className="space-y-4">
            <StatComparison
              label="Total dépensé"
              myValue={myTotalSpent}
              friendValue={friendTotalSpent}
              format={(v) => formatCurrency(v, 'EUR')}
            />
            <StatComparison
              label="Tables scannées"
              myValue={myOutings.length}
              friendValue={friendOutings.length}
            />
            <StatComparison
              label="Cartes rares+"
              myValue={myRareCards}
              friendValue={friendRareCards}
            />
            <StatComparison
              label="Cartes totales"
              myValue={myCards.length}
              friendValue={friendCards.length}
            />
          </div>
        </div>

        {/* Collection Comparison */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Collections</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-purple-400 font-medium mb-2">Vos cartes</h3>
              <div className="grid grid-cols-3 gap-2">
                {myCards.slice(0, 6).map(card => (
                  <div
                    key={card.id}
                    className={`bg-gradient-to-br ${getRarityColor(card.bottles.rarity_tier)} rounded-lg p-2 aspect-square flex items-center justify-center text-white`}
                  >
                    <span className="text-2xl">🍾</span>
                  </div>
                ))}
                {myCards.length > 6 && (
                  <div className="bg-gray-700 rounded-lg p-2 aspect-square flex items-center justify-center text-white">
                    +{myCards.length - 6}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-pink-400 font-medium mb-2">Cartes de {friendProfile.username}</h3>
              <div className="grid grid-cols-3 gap-2">
                {friendCards.slice(0, 6).map(card => (
                  <div
                    key={card.id}
                    className={`bg-gradient-to-br ${getRarityColor(card.bottles.rarity_tier)} rounded-lg p-2 aspect-square flex items-center justify-center text-white`}
                  >
                    <span className="text-2xl">🍾</span>
                  </div>
                ))}
                {friendCards.length > 6 && (
                  <div className="bg-gray-700 rounded-lg p-2 aspect-square flex items-center justify-center text-white">
                    +{friendCards.length - 6}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Outings */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Dernières tables</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-purple-400 font-medium mb-2">Vos dernières tables</h3>
              {myOutings.slice(0, 3).map(outing => (
                <div key={outing.id} className="bg-gray-700/50 rounded-lg p-3 mb-2">
                  <p className="text-white">{outing.venues?.name}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(outing.total_price, outing.currency)}</p>
                </div>
              ))}
              {myOutings.length === 0 && (
                <p className="text-gray-500 text-sm">Aucune table</p>
              )}
            </div>
            <div>
              <h3 className="text-pink-400 font-medium mb-2">Dernières tables de {friendProfile.username}</h3>
              {friendOutings.slice(0, 3).map(outing => (
                <div key={outing.id} className="bg-gray-700/50 rounded-lg p-3 mb-2">
                  <p className="text-white">{outing.venues?.name}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(outing.total_price, outing.currency)}</p>
                </div>
              ))}
              {friendOutings.length === 0 && (
                <p className="text-gray-500 text-sm">Aucune table</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatComparison({ label, myValue, friendValue, format }: { 
  label: string
  myValue: number
  friendValue: number
  format?: (v: number) => string 
}) {
  const myFormatted = format ? format(myValue) : myValue.toString()
  const friendFormatted = format ? format(friendValue) : friendValue.toString()
  const isWinner = myValue > friendValue
  const isTie = myValue === friendValue

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-4">
        <span className={`font-medium ${isWinner ? 'text-green-400' : isTie ? 'text-gray-400' : 'text-gray-400'}`}>
          {myFormatted}
        </span>
        <span className="text-gray-600">vs</span>
        <span className={`font-medium ${!isWinner && !isTie ? 'text-green-400' : isTie ? 'text-gray-400' : 'text-gray-400'}`}>
          {friendFormatted}
        </span>
      </div>
    </div>
  )
}
