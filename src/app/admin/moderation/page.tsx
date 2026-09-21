'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface PendingPrice {
  id: string
  venue_id: string
  bottle_id: string
  price: number
  currency: string
  submitted_by: string
  updated_at: string
  venues: {
    id: string
    name: string
    city: string
  }
  bottles: {
    id: string
    brand: string
    name: string
  }
  profiles: {
    id: string
    username: string
  }
}

interface PendingBottle {
  id: string
  brand: string
  name: string
  rarity_tier: string
  base_xp: number
  submitted_by: string
  suggested_by_ai: boolean
  created_at: string
  profiles: {
    id: string
    username: string
  }
}

export default function ModerationPage() {
  const [pendingPrices, setPendingPrices] = useState<PendingPrice[]>([])
  const [pendingBottles, setPendingBottles] = useState<PendingBottle[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [activeTab, setActiveTab] = useState<'prices' | 'bottles'>('prices')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      router.push('/')
      return
    }

    setIsAdmin(true)
    setCheckingAdmin(false)
    Promise.all([loadPendingPrices(), loadPendingBottles()])
    setLoading(false)
  }

  const loadPendingPrices = async () => {
    const { data } = await supabase
      .from('venue_bottle_prices')
      .select(`
        *,
        venues (*),
        bottles (*),
        profiles!venue_bottle_prices_submitted_by_fkey (*)
      `)
      .eq('status', 'pending')
      .order('updated_at', { ascending: false })

    setPendingPrices(data || [])
  }

  const loadPendingBottles = async () => {
    const { data } = await supabase
      .from('bottles')
      .select(`
        *,
        profiles!bottles_submitted_by_fkey (*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    setPendingBottles(data || [])
  }

  const handleApprove = async (priceId: string) => {
    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId, action: 'approve' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'approbation')
      }

      loadPendingPrices()
    } catch (error: any) {
      console.error('Approve error:', error)
      alert(error.message || 'Erreur lors de l\'approbation')
    }
  }

  const handleReject = async (priceId: string) => {
    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId, action: 'reject' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du rejet')
      }

      loadPendingPrices()
    } catch (error: any) {
      console.error('Reject error:', error)
      alert(error.message || 'Erreur lors du rejet')
    }
  }

  const handleApproveBottle = async (bottleId: string, correctedData?: any) => {
    try {
      const response = await fetch('/api/admin/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bottle_id: bottleId,
          action: 'approve',
          ...correctedData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'approbation')
      }

      loadPendingBottles()
    } catch (error: any) {
      console.error('Approve bottle error:', error)
      alert(error.message || 'Erreur lors de l\'approbation')
    }
  }

  const handleRejectBottle = async (bottleId: string) => {
    try {
      const response = await fetch('/api/admin/bottles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bottle_id: bottleId, action: 'reject' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du rejet')
      }

      loadPendingBottles()
    } catch (error: any) {
      console.error('Reject bottle error:', error)
      alert(error.message || 'Erreur lors du rejet')
    }
  }

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4 flex items-center justify-center">
        <div className="text-white">Vérification des droits...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Modération</h1>
          <button
            onClick={() => router.push('/profile')}
            className="text-gray-400 hover:text-white"
          >
            Mon profil
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('prices')}
            className={`flex-1 py-3 px-6 rounded-lg transition-colors ${
              activeTab === 'prices'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Prix en attente ({pendingPrices.length})
          </button>
          <button
            onClick={() => setActiveTab('bottles')}
            className={`flex-1 py-3 px-6 rounded-lg transition-colors ${
              activeTab === 'bottles'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Bouteilles en attente ({pendingBottles.length})
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : activeTab === 'prices' ? (
          /* Pending Prices */
          pendingPrices.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 text-center">
              <p className="text-gray-400">Aucun prix en attente de modération</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPrices.map(price => (
                <div
                  key={price.id}
                  className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {price.bottles.brand} {price.bottles.name}
                      </h3>
                      <p className="text-gray-400">{price.venues.name}</p>
                      <p className="text-sm text-gray-500">{price.venues.city}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-400">
                        {formatCurrency(price.price, price.currency)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Soumis par {price.profiles.username || 'Anonyme'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(price.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleApprove(price.id)}
                      className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ✓ Approuver
                    </button>
                    <button
                      onClick={() => handleReject(price.id)}
                      className="flex-1 py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ✕ Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Pending Bottles */
          pendingBottles.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 text-center">
              <p className="text-gray-400">Aucune bouteille en attente de modération</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBottles.map(bottle => (
                <BottleModerationCard
                  key={bottle.id}
                  bottle={bottle}
                  onApprove={handleApproveBottle}
                  onReject={handleRejectBottle}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function BottleModerationCard({
  bottle,
  onApprove,
  onReject,
}: {
  bottle: PendingBottle
  onApprove: (id: string, data?: any) => void
  onReject: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [correctedBrand, setCorrectedBrand] = useState(bottle.brand)
  const [correctedName, setCorrectedName] = useState(bottle.name)
  const [correctedRarity, setCorrectedRarity] = useState(bottle.rarity_tier)
  const [correctedXp, setCorrectedXp] = useState(bottle.base_xp)

  const handleApprove = () => {
    if (editing) {
      onApprove(bottle.id, {
        brand: correctedBrand,
        name: correctedName,
        rarity_tier: correctedRarity,
        base_xp: correctedXp,
      })
    } else {
      onApprove(bottle.id)
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {bottle.brand} {bottle.name}
          </h3>
          <p className="text-sm text-gray-500">
            {bottle.suggested_by_ai && '🤖 Suggérée par IA • '}
            Soumis par {bottle.profiles.username || 'Anonyme'}
          </p>
          <p className="text-xs text-gray-600">
            {new Date(bottle.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          {editing ? 'Annuler édition' : 'Modifier avant approbation'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Marque</label>
            <input
              type="text"
              value={correctedBrand}
              onChange={(e) => setCorrectedBrand(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
            <input
              type="text"
              value={correctedName}
              onChange={(e) => setCorrectedName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rareté</label>
            <select
              value={correctedRarity}
              onChange={(e) => setCorrectedRarity(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="commune">Commune</option>
              <option value="rare">Rare</option>
              <option value="epique">Épique</option>
              <option value="legendaire">Légendaire</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">XP de base (1-100)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={correctedXp}
              onChange={(e) => setCorrectedXp(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-400">Rareté</p>
            <p className="text-white font-medium">{bottle.rarity_tier}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">XP de base</p>
            <p className="text-white font-medium">{bottle.base_xp}</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <button
          onClick={handleApprove}
          className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          ✓ Approuver {editing ? '(avec corrections)' : ''}
        </button>
        <button
          onClick={() => onReject(bottle.id)}
          className="flex-1 py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          ✕ Rejeter
        </button>
      </div>
    </div>
  )
}
