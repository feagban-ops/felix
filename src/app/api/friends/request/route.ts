import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

const friendRequestSchema = z.object({
  friend_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Rate limiting: 10 friend requests per hour per user
    const identifier = `friends_${user.id}`
    const rateLimitResult = await rateLimit(identifier, 10, 3600000)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de demandes d\'amis. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { friend_id } = friendRequestSchema.parse(body)

    if (friend_id === user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous ajouter vous-même' }, { status: 400 })
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Une relation d\'amitié existe déjà' }, { status: 400 })
    }

    const { error } = await supabase.from('friendships').insert({
      user_id: user.id,
      friend_id,
      status: 'pending',
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
