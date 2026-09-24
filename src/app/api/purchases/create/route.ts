import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

const createPurchaseSchema = z.object({
  bottle_id: z.string().uuid(),
  venue_id: z.string().uuid(),
  outing_id: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Rate limiting: 20 purchases per hour per user (defense in depth)
    const identifier = `purchase_${user.id}`
    const rateLimitResult = await rateLimit(identifier, 20, 3600000)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop d\'achats. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { bottle_id, venue_id, outing_id } = createPurchaseSchema.parse(body)

    // Call the secure server-side function with normal server client
    // The function will verify p_user_id matches auth.uid() and enforce rate limiting
    const { data, error } = await supabase.rpc('create_purchase_atomically', {
      p_user_id: user.id,
      p_bottle_id: bottle_id,
      p_venue_id: venue_id,
      p_outing_id: outing_id,
    })

    if (error) {
      console.error('Purchase creation error:', error)
      return NextResponse.json({ error: 'Erreur lors de la création de l\'achat' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('Purchase creation error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
