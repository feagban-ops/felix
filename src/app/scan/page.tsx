'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DetectedBottle {
  id: string
  name: string
  brand: string
  confidence: number
  quantity: number
}

export default function ScanPage() {
  const [photo, setPhoto] = useState<string | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<string>('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [detectedBottles, setDetectedBottles] = useState<DetectedBottle[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'photo' | 'venue' | 'analyze' | 'correct'>('photo')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      // Upload photo using secure API endpoint
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }

      const data = await response.json()
      setPhoto(data.url)
      setStep('venue')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!photo || !selectedVenue) {
      setError('Veuillez sélectionner une photo et un établissement')
      return
    }

    setAnalyzing(true)
    setError('')

    try {
      const response = await fetch('/api/scan/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: photo, venueId: selectedVenue }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'analyse')
      }

      const data = await response.json()
      setDetectedBottles(data.bottles || [])
      setStep('correct')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCreateOuting = async () => {
    if (!photo || !selectedVenue || detectedBottles.length === 0) {
      setError('Données incomplètes')
      return
    }

    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // Create outing
      const { data: outing, error: outingError } = await supabase
        .from('outings')
        .insert({
          owner_id: user.id,
          venue_id: selectedVenue,
          photo_url: photo,
          is_private: isPrivate,
        })
        .select()
        .single()

      if (outingError) throw outingError

      // Add bottles to outing
      for (const bottle of detectedBottles) {
        await supabase.from('outing_bottles').insert({
          outing_id: outing.id,
          bottle_id: bottle.id,
          quantity: bottle.quantity,
        })
      }

      // Close outing to trigger gamification
      await fetch('/api/outings/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outingId: outing.id }),
      })

      router.push(`/outings/${outing.id}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleCameraCapture = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Scanner une table</h1>
          <button
            onClick={() => router.push('/profile')}
            className="text-gray-400 hover:text-white"
          >
            Mon profil
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Photo */}
        {step === 'photo' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">📸 Photo de la table</h2>
              <p className="text-gray-400 mb-4">
                Prenez une photo de votre table VIP avec les bouteilles visibles
              </p>

              {photo ? (
                <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                  <img src={photo} alt="Table" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <p className="text-gray-500">Aucune photo sélectionnée</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <button
                onClick={handleCameraCapture}
                disabled={uploading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
              >
                {uploading ? 'Chargement...' : '📷 Prendre une photo'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Venue */}
        {step === 'venue' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">🏢 Établissement</h2>
              
              <VenueSelector 
                selectedVenue={selectedVenue}
                onSelect={setSelectedVenue}
              />

              <div className="mt-4 flex items-center gap-3">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-300">
                  Sortie privée (non visible dans les classements)
                </label>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setStep('photo')}
                  className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedVenue || analyzing}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {analyzing ? 'Analyse...' : 'Analyser 🤖'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Correction */}
        {step === 'correct' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">✏️ Corriger les bouteilles</h2>
              <p className="text-gray-400 mb-4">
                Vérifiez et corrigez les bouteilles détectées avant de valider
              </p>

              <BottleCorrection
                bottles={detectedBottles}
                onChange={setDetectedBottles}
              />

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setStep('venue')}
                  className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleCreateOuting}
                  disabled={detectedBottles.length === 0 || uploading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {uploading ? 'Création...' : 'Valider la table ✅'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VenueSelector({ selectedVenue, onSelect }: { selectedVenue: string, onSelect: (venueId: string) => void }) {
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .order('name')
    
    setVenues(data || [])
    setLoading(false)
  }

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Rechercher un établissement..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {filteredVenues.map(venue => (
            <button
              key={venue.id}
              onClick={() => onSelect(venue.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedVenue === venue.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">{venue.name}</div>
              <div className="text-sm opacity-75">{venue.city}, {venue.country}</div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => {/* TODO: Create new venue modal */}}
        className="w-full py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-dashed border-gray-600"
      >
        + Créer un nouvel établissement
      </button>
    </div>
  )
}

function BottleCorrection({ bottles, onChange }: { bottles: DetectedBottle[], onChange: (bottles: DetectedBottle[]) => void }) {
  const [allBottles, setAllBottles] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadBottles()
  }, [])

  const loadBottles = async () => {
    const { data } = await supabase.from('bottles').select('*').order('name')
    setAllBottles(data || [])
  }

  const updateBottle = (index: number, updates: Partial<DetectedBottle>) => {
    const newBottles = [...bottles]
    newBottles[index] = { ...newBottles[index], ...updates }
    onChange(newBottles)
  }

  const removeBottle = (index: number) => {
    const newBottles = bottles.filter((_, i) => i !== index)
    onChange(newBottles)
  }

  const addBottle = () => {
    onChange([...bottles, { id: '', name: '', brand: '', confidence: 0, quantity: 1 }])
  }

  return (
    <div className="space-y-3">
      {bottles.map((bottle, index) => (
        <div key={index} className="bg-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <select
              value={bottle.id}
              onChange={(e) => {
                const selected = allBottles.find(b => b.id === e.target.value)
                if (selected) {
                  updateBottle(index, {
                    id: selected.id,
                    name: selected.name,
                    brand: selected.brand,
                  })
                }
              }}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            >
              <option value="">Sélectionner une bouteille</option>
              {allBottles.map(b => (
                <option key={b.id} value={b.id}>{b.brand} - {b.name}</option>
              ))}
            </select>
            <button
              onClick={() => removeBottle(index)}
              className="text-red-400 hover:text-red-300 ml-2"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="text-sm text-gray-400">Quantité</label>
            <input
              type="number"
              min="1"
              value={bottle.quantity}
              onChange={(e) => updateBottle(index, { quantity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
      ))}

      <button
        onClick={addBottle}
        className="w-full py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-dashed border-gray-600"
      >
        + Ajouter une bouteille
      </button>
    </div>
  )
}
