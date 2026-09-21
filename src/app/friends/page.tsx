'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Friend {
  id: string
  username: string
  avatar_url: string | null
  xp: number
  level: number
}

interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted'
  created_at: string
  friend: Friend
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Load accepted friends
    const { data: acceptedFriends } = await supabase
      .from('friendships')
      .select(`
        *,
        friend:profiles!friendships_friend_id_fkey (*)
      `)
      .or(`and(user_id.eq.${user.id},status.eq.accepted),and(friend_id.eq.${user.id},status.eq.accepted)`)
    
    // Load pending requests (where user is the recipient)
    const { data: pending } = await supabase
      .from('friendships')
      .select(`
        *,
        friend:profiles!friendships_user_id_fkey (*)
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending')

    setFriends(acceptedFriends || [])
    setPendingRequests(pending || [])
    setLoading(false)
  }

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)

      if (error) throw error

      loadFriends()
    } catch (error: any) {
      console.error('Accept error:', error)
      alert('Erreur lors de l\'acceptation')
    }
  }

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      loadFriends()
    } catch (error: any) {
      console.error('Reject error:', error)
      alert('Erreur lors du rejet')
    }
  }

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      loadFriends()
    } catch (error: any) {
      console.error('Remove error:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Mes Amis</h1>
          <button
            onClick={() => router.push('/scan')}
            className="text-gray-400 hover:text-white"
          >
            Scanner
          </button>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-yellow-900/20 backdrop-blur rounded-xl p-6 border border-yellow-900/50">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4">
              Demandes d'ami en attente ({pendingRequests.length})
            </h2>
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div
                  key={request.id}
                  className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {request.friend.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{request.friend.username}</p>
                      <p className="text-sm text-gray-400">Niveau {request.friend.level}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Mes amis ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Vous n'avez pas encore d'amis
            </p>
          ) : (
            <div className="space-y-3">
              {friends.map(friendship => {
                const friend = friendship.friend
                const isCurrentUserTheRequester = friendship.user_id !== friendship.friend_id

                return (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {friend.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{friend.username}</p>
                        <p className="text-sm text-gray-400">Niveau {friend.level} • {friend.xp} XP</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/friends/${friend.id}/compare`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Comparer
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friendship.id)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Friend Button */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          + Ajouter un ami
        </button>

        {/* Search Modal */}
        {showSearchModal && (
          <FriendSearchModal
            onClose={() => setShowSearchModal(false)}
            onSuccess={() => {
              setShowSearchModal(false)
              loadFriends()
            }}
          />
        )}
      </div>
    </div>
  )
}

function FriendSearchModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSearch = async () => {
    if (!search.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${search}%`)
        .neq('id', user.id)
        .limit(10)

      setResults(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { error } = await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      })

      if (error) throw error

      onSuccess()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Rechercher un ami</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Pseudo de l'ami..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : '🔍'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map(profile => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {profile.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{profile.username}</p>
                      <p className="text-sm text-gray-400">Niveau {profile.level}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendRequest(profile.id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
