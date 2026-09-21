import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch all user data
    const [profile, outings, cards, friendships, subscriptions, purchases] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('outings').select('*').eq('owner_id', user.id),
      supabase.from('cards').select('*').eq('user_id', user.id),
      supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
      supabase.from('subscriptions').select('*').eq('user_id', user.id),
      supabase.from('purchases').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      profile: profile.data,
      outings: outings.data,
      cards: cards.data,
      friendships: friendships.data,
      subscriptions: subscriptions.data,
      purchases: purchases.data,
      exportedAt: new Date().toISOString(),
    }

    return NextResponse.json(exportData)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
