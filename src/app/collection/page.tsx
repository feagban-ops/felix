'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getRarityColor, getRarityLabel } from '@/lib/gamification'

interface Card {
  id: string
  bottle_id: string
  quantity: number
  first_obtained_at: string
  bottles: {
    id: string
    brand: string
    name: string
    rarity_tier: string
    image_url: string | null
  }
}

export default function CollectionPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'commune' | 'rare' | 'epique' | 'legendaire'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('cards')
      .select(`
        *,
        bottles (*)
      `)
      .eq('user_id', user.id)
      .order('first_obtained_at', { ascending: false })
    
    setCards(data || [])
    setLoading(false)
  }

  const filteredCards = cards.filter(card => {
    if (filter === 'all') return true
    return card.bottles.rarity_tier === filter
  })

  const groupedCards = filteredCards.reduce((acc, card) => {
    const rarity = card.bottles.rarity_tier
    if (!acc[rarity]) acc[rarity] = []
    acc[rarity].push(card)
    return acc
  }, {} as Record<string, Card[]>)

  const rarityOrder = ['legendaire', 'epique', 'rare', 'commune']

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Ma Collection</h1>
          <button
            onClick={() => router.push('/scan')}
            className="text-gray-400 hover:text-white"
          >
            Scanner
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-white">{cards.length}</p>
            <p className="text-sm text-gray-400">Cartes uniques</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-purple-400">
              {cards.reduce((sum, c) => sum + c.quantity, 0)}
            </p>
            <p className="text-sm text-gray-400">Total cartes</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {cards.filter(c => c.bottles.rarity_tier === 'legendaire').length}
            </p>
            <p className="text-sm text-gray-400">Légendaires</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700 text-center">
            <p className="text-3xl font-bold text-blue-400">
              {cards.filter(c => c.bottles.rarity_tier === 'epique').length}
            </p>
            <p className="text-sm text-gray-400">Épiques</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'commune', 'rare', 'epique', 'legendaire'] as const).map(rarity => (
            <button
              key={rarity}
              onClick={() => setFilter(rarity)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                filter === rarity
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {rarity === 'all' ? 'Toutes' : getRarityLabel(rarity)}
            </button>
          ))}
        </div>

        {/* Collection */}
        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : filteredCards.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 text-center">
            <p className="text-gray-400">
              {filter === 'all' 
                ? 'Aucune carte dans votre collection' 
                : `Aucune carte ${getRarityLabel(filter)} dans votre collection`}
            </p>
            <button
              onClick={() => router.push('/scan')}
              className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Scanner une table
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {rarityOrder
              .filter(rarity => filter === 'all' || rarity === filter)
              .map(rarity => {
                const rarityCards = groupedCards[rarity]
                if (!rarityCards || rarityCards.length === 0) return null

                return (
                  <div key={rarity} className="space-y-3">
                    <h2 className="text-xl font-semibold text-white capitalize">
                      {getRarityLabel(rarity)} ({rarityCards.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {rarityCards.map(card => (
                        <CardItem key={card.id} card={card} />
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

function CardItem({ card }: { card: Card }) {
  const rarityGradient = getRarityColor(card.bottles.rarity_tier)

  return (
    <div className="relative">
      <div className={`bg-gradient-to-br ${rarityGradient} rounded-xl p-4 aspect-[3/4] flex flex-col items-center justify-center text-white shadow-lg`}>
        {card.bottles.image_url ? (
          <img
            src={card.bottles.image_url}
            alt={card.bottles.name}
            className="w-full h-32 object-contain mb-2"
          />
        ) : (
          <div className="w-full h-32 flex items-center justify-center mb-2 bg-white/10 rounded-lg">
            <span className="text-4xl">🍾</span>
          </div>
        )}
        
        <h3 className="font-semibold text-sm text-center mb-1">{card.bottles.name}</h3>
        <p className="text-xs opacity-75 text-center">{card.bottles.brand}</p>
        
        <div className="mt-auto flex items-center gap-2">
          <span className="bg-black/30 px-2 py-1 rounded text-xs">
            x{card.quantity}
          </span>
          {card.quantity > 1 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
              +
            </span>
          )}
        </div>
      </div>
      
      {card.quantity === 1 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          ✓
        </div>
      )}
    </div>
  )
}
