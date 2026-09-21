import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bottleModerationSchema = z.object({
  bottle_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  brand: z.string().optional(),
  name: z.string().optional(),
  rarity_tier: z.enum(['commune', 'rare', 'epique', 'legendaire']).optional(),
  base_xp: z.number().int().min(1).max(100).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { bottle_id, action, brand, name, rarity_tier, base_xp } = bottleModerationSchema.parse(body)

    // Use service client to bypass RLS for moderation
    const serviceClient = createServiceClient()

    if (action === 'approve') {
      const updateData: any = { status: 'approved' }
      if (brand) updateData.brand = brand
      if (name) updateData.name = name
      if (rarity_tier) updateData.rarity_tier = rarity_tier
      if (base_xp) updateData.base_xp = base_xp

      const { error } = await serviceClient
        .from('bottles')
        .update(updateData)
        .eq('id', bottle_id)

      if (error) throw error
    } else if (action === 'reject') {
      const { error } = await serviceClient
        .from('bottles')
        .update({ status: 'rejected' })
        .eq('id', bottle_id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
