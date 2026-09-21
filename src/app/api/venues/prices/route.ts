import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'

const priceSubmissionSchema = z.object({
  venue_id: z.string().uuid(),
  bottle_id: z.string().uuid(),
  price: z.number().positive(),
  currency: z.string().default('EUR'),
})

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Rate limiting: 15 price submissions per hour per user
    const identifier = `prices_${user.id}`
    const rateLimitResult = await rateLimit(identifier, 15, 3600000)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de soumissions de prix. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { venue_id, bottle_id, price, currency } = priceSubmissionSchema.parse(body)

    // Check if price already exists
    const { data: existing } = await supabase
      .from('venue_bottle_prices')
      .select('*')
      .eq('venue_id', venue_id)
      .eq('bottle_id', bottle_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Un prix existe déjà pour cette combinaison' }, { status: 400 })
    }

    const { error } = await supabase.from('venue_bottle_prices').insert({
      venue_id,
      bottle_id,
      price,
      currency,
      submitted_by: user.id,
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
