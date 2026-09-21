import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const closeOutingSchema = z.object({
  outingId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { outingId } = closeOutingSchema.parse(body)

    const { data, error } = await supabase.rpc('close_outing_atomically', {
      p_user_id: user.id,
      p_outing_id: outingId,
    })

    if (error) {
      console.error('Outing close error:', error)
      return NextResponse.json({ error: error.message || 'Erreur lors de la fermeture de la table' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('Outing close error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
