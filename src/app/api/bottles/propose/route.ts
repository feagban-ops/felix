import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { proposeBottle } from '@/lib/bottles/propose-bottle'

const proposeBottleSchema = z.object({
  brand: z.string().min(1),
  name: z.string().min(1),
  rarity_tier: z.enum(['commune', 'rare', 'epique', 'legendaire']),
  base_xp: z.number().int().min(1).max(100),
})

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { brand, name, rarity_tier, base_xp } = proposeBottleSchema.parse(body)

    // Insert bottle with status='pending' (enforced by RLS)
    const { data, error } = await proposeBottle({
      supabase,
      userId: user.id,
      brand,
      name,
      rarityTier: rarity_tier,
      baseXp: base_xp,
    })

    if (error) {
      if (error.message === 'Trop de propositions de bouteilles, réessaie plus tard') {
        return NextResponse.json({ error: error.message }, { status: 429 })
      }
      throw error
    }

    return NextResponse.json({
      ...data,
      message: 'Nouvelle bouteille proposée : en attente de validation admin. Tu ne reçois pas encore la carte/XP.',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('Bottle proposal error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
