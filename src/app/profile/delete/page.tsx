'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfileDeletePage() {
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (confirmation !== 'SUPPRIMER') {
      setError('Vous devez taper "SUPPRIMER" pour confirmer')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // Call the delete API
      const response = await fetch('/api/profile/delete', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      // Sign out
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-red-400">Supprimer mon compte</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Warning */}
        <div className="bg-red-900/20 backdrop-blur rounded-xl p-6 border border-red-900/50">
          <h2 className="text-xl font-semibold text-red-400 mb-4">⚠️ Attention</h2>
          <p className="text-gray-300 mb-4">
            Cette action est irréversible. Toutes vos données seront supprimées définitivement :
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>Votre profil et vos paramètres</li>
            <li>Toutes vos sorties et tables scannées</li>
            <li>Votre collection de cartes</li>
            <li>Vos amitiés</li>
            <li>Votre abonnement premium</li>
          </ul>
        </div>

        {/* Confirmation Form */}
        <form onSubmit={handleDelete} className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 space-y-6">
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-300 mb-2">
              Tapez "SUPPRIMER" pour confirmer
            </label>
            <input
              id="confirmation"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="SUPPRIMER"
            />
          </div>

          <button
            type="submit"
            disabled={loading || confirmation !== 'SUPPRIMER'}
            className="w-full py-4 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Suppression...' : 'Supprimer définitivement mon compte'}
          </button>
        </form>
      </div>
    </div>
  )
}
