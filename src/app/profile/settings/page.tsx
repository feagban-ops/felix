'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { signOut } from '@supabase/auth-helpers-nextjs'

export default function ProfileSettingsPage() {
  const [username, setUsername] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUsername(profile.username || '')
      setIsPrivate(profile.is_private)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          is_private: isPrivate,
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage('Paramètres sauvegardés avec succès')
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
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
          <h1 className="text-3xl font-bold text-white">Paramètres du compte</h1>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded ${
            message.includes('succès') 
              ? 'bg-green-500/10 border border-green-500 text-green-500' 
              : 'bg-red-500/10 border border-red-500 text-red-500'
          }`}>
            {message}
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Pseudo
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="isPrivate"
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-300">
              Profil privé (vos sorties ne seront pas visibles dans les classements)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>

        {/* Danger Zone */}
        <div className="bg-red-900/20 backdrop-blur rounded-xl p-6 border border-red-900/50 space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Zone de danger</h2>
          
          <button
            onClick={handleLogout}
            className="w-full py-3 px-6 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            Déconnexion
          </button>

          <button
            onClick={() => router.push('/profile/delete')}
            className="w-full py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  )
}
