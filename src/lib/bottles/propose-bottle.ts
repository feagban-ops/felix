import { SupabaseClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'

interface ProposeBottleParams {
  supabase: SupabaseClient
  userId: string
  brand: string
  name: string
  rarityTier: 'commune' | 'rare' | 'epique' | 'legendaire'
  baseXp: number
}

export async function proposeBottle({
  supabase,
  userId,
  brand,
  name,
  rarityTier,
  baseXp,
}: ProposeBottleParams) {
  const { success } = await rateLimit(`propose_bottle_${userId}`, 10, 3600000)
  if (!success) {
    return {
      data: null,
      error: { message: 'Trop de propositions de bouteilles, réessaie plus tard' },
    }
  }

  return supabase
    .from('bottles')
    .insert({
      brand,
      name,
      rarity_tier: rarityTier,
      base_xp: baseXp,
      submitted_by: userId,
      suggested_by_ai: true,
    })
    .select()
    .single()
}
