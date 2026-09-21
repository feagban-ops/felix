'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { isPremium, getSubscription } from '@/lib/stripe'

export default function PremiumPage() {
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkPremiumStatus()
  }, [])

  const checkPremiumStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const premium = await isPremium(user.id)
    const sub = await getSubscription(user.id)

    setIsPremiumUser(premium)
    setSubscription(sub)
    setLoading(false)
  }

  const handleSubscribe = async () => {
    setCheckoutLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création du checkout')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    // For now, redirect to profile. In production, you'd create a customer portal
    router.push('/profile')
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-white">Bottle VIP Premium</h1>
        </div>

        {/* Premium Status */}
        {isPremiumUser ? (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur rounded-xl p-6 border border-yellow-500/50">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">👑</span>
              <div>
                <h2 className="text-2xl font-bold text-yellow-400">Premium Actif</h2>
                <p className="text-gray-300">
                  {subscription?.current_period_end && (
                    <>Renouvellement le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}</>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleManageSubscription}
              className="w-full py-3 px-6 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Gérer l'abonnement
            </button>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Passez Premium</h2>
            <p className="text-gray-300 mb-6">
              Débloquez des fonctionnalités exclusives et soutenez le développement de Bottle VIP
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Accès aux classements avancés</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Historique illimité des sorties</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Badges exclusifs</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Statistiques détaillées</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Support prioritaire</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-white mb-2">9,99€ / mois</p>
              <p className="text-gray-200 mb-4">Sans engagement</p>
              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                className="w-full py-4 px-6 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? 'Chargement...' : 'S\'abonner maintenant'}
              </button>
            </div>
          </div>
        )}

        {/* Features Comparison */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Comparaison</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm mb-2">Fonctionnalité</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Gratuit</p>
            </div>
            <div>
              <p className="text-yellow-400 text-sm mb-2">Premium</p>
            </div>

            {[
              'Classements basiques',
              'Classements avancés',
              'Historique 30 jours',
              'Historique illimité',
              'Badges standards',
              'Badges exclusifs',
              'Support standard',
              'Support prioritaire',
            ].map((feature, index) => (
              <div key={index} className="contents">
                <div className="py-2 text-left text-gray-300 text-sm">{feature}</div>
                <div className="py-2">
                  {index < 2 ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-gray-600">✕</span>
                  )}
                </div>
                <div className="py-2">
                  <span className="text-green-400">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
