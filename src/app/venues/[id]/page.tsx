'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface VenueBottlePrice {
  id: string
  bottle_id: string
  price: number
  currency: string
  status: 'pending' | 'approved' | 'rejected'
  bottles: {
    id: string
    brand: string
    name: string
    rarity_tier: string
  }
}

export default function VenueDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [venue, setVenue] = useState<any>(null)
  const [prices, setPrices] = useState<VenueBottlePrice[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddPriceModal, setShowAddPriceModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (id) {
      loadVenue()
      loadPrices()
    }
  }, [id])

  const loadVenue = async () => {
    const { data } = await supabase.from('venues').select('*').eq('id', id).single()
    setVenue(data)
  }

  const loadPrices = async () => {
    const { data } = await supabase
      .from('venue_bottle_prices')
      .select(`
        *,
        bottles (*)
      `)
      .eq('venue_id', id)
      .order('bottles.name')
    
    setPrices(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4 flex items-center justify-center">
        <div className="text-white">Établissement non trouvé</div>
      </div>
    )
  }

  const approvedPrices = prices.filter(p => p.status === 'approved')
  const pendingPrices = prices.filter(p => p.status === 'pending')

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-white">{venue.name}</h1>
        </div>

        {/* Venue Info */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <p className="text-gray-300">{venue.city}, {venue.country}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
              {venue.region}
            </span>
            {venue.verified && (
              <span className="text-xs px-2 py-1 bg-green-600 rounded text-white">
                ✓ Vérifié
              </span>
            )}
          </div>
        </div>

        {/* Approved Prices */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Prix approuvés</h2>
          {approvedPrices.length === 0 ? (
            <p className="text-gray-500">Aucun prix approuvé</p>
          ) : (
            <div className="space-y-3">
              {approvedPrices.map(price => (
                <div
                  key={price.id}
                  className="flex justify-between items-center py-3 border-b border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{price.bottles.brand} {price.bottles.name}</p>
                    <p className="text-sm text-gray-400">{price.bottles.rarity_tier}</p>
                  </div>
                  <p className="text-lg font-semibold text-purple-400">
                    {formatCurrency(price.price, price.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Prices */}
        {pendingPrices.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Prix en attente de modération</h2>
            <div className="space-y-3">
              {pendingPrices.map(price => (
                <div
                  key={price.id}
                  className="flex justify-between items-center py-3 border-b border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{price.bottles.brand} {price.bottles.name}</p>
                    <p className="text-sm text-yellow-400">En attente</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-400">
                    {formatCurrency(price.price, price.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Price Button */}
        <button
          onClick={() => setShowAddPriceModal(true)}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          + Soumettre un prix
        </button>

        {/* Add Price Modal */}
        {showAddPriceModal && (
          <AddPriceModal
            venueId={id as string}
            onClose={() => setShowAddPriceModal(false)}
            onSuccess={() => {
              setShowAddPriceModal(false)
              loadPrices()
            }}
          />
        )}
      </div>
    </div>
  )
}

function AddPriceModal({ venueId, onClose, onSuccess }: { venueId: string, onClose: () => void, onSuccess: () => void }) {
  const [bottleId, setBottleId] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bottles, setBottles] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadBottles()
  }, [])

  const loadBottles = async () => {
    const { data } = await supabase.from('bottles').select('*').order('name')
    setBottles(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { error } = await supabase.from('venue_bottle_prices').insert({
        venue_id: venueId,
        bottle_id: bottleId,
        price: parseFloat(price),
        currency,
        submitted_by: user.id,
      })

      if (error) throw error

      onSuccess()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Soumettre un prix</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bouteille</label>
            <select
              value={bottleId}
              onChange={(e) => setBottleId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Sélectionner une bouteille</option>
              {bottles.map(bottle => (
                <option key={bottle.id} value={bottle.id}>
                  {bottle.brand} - {bottle.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Prix</label>
            <input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Soumission...' : 'Soumettre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
