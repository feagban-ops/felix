import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const addParticipantSchema = z.object({
  user_id: z.string().uuid(),
})

const outingIdSchema = z.string().uuid()

export async function POST(
  request: Request,
  { params }: { params: { outingId: string } }
) {
  try {
    const { outingId } = outingIdSchema.parse(params)
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if user is the outing owner
    const { data: outing } = await supabase
      .from('outings')
      .select('*')
      .eq('id', outingId)
      .single()

    if (!outing) {
      return NextResponse.json({ error: 'Sortie non trouvée' }, { status: 404 })
    }

    if (outing.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id } = addParticipantSchema.parse(body)

    // Check if user is already a participant
    const { data: existing } = await supabase
      .from('outing_participants')
      .select('*')
      .eq('outing_id', outingId)
      .eq('user_id', user_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Utilisateur déjà participant' }, { status: 400 })
    }

    const { error } = await supabase.from('outing_participants').insert({
      outing_id: outingId,
      user_id,
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

export async function GET(
  request: Request,
  { params }: { params: { outingId: string } }
) {
  try {
    const { outingId } = outingIdSchema.parse(params)
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if user can view this outing
    const { data: outing } = await supabase
      .from('outings')
      .select('*')
      .eq('id', outingId)
      .single()

    if (!outing) {
      return NextResponse.json({ error: 'Sortie non trouvée' }, { status: 404 })
    }

    if (outing.owner_id !== user.id && outing.is_private) {
      // Check if user is a participant
      const { data: isParticipant } = await supabase
        .from('outing_participants')
        .select('*')
        .eq('outing_id', outingId)
        .eq('user_id', user.id)
        .single()

      if (!isParticipant) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }
    }

    const { data: participants } = await supabase
      .from('outing_participants')
      .select(`
        *,
        profiles (*)
      `)
      .eq('outing_id', outingId)

    return NextResponse.json({ participants })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { outingId: string } }
) {
  try {
    const { outingId } = outingIdSchema.parse(params)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 })
    }

    const userIdSchema = z.string().uuid()
    userIdSchema.parse(userId)

    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if user is the outing owner
    const { data: outing } = await supabase
      .from('outings')
      .select('*')
      .eq('id', outingId)
      .single()

    if (!outing) {
      return NextResponse.json({ error: 'Sortie non trouvée' }, { status: 404 })
    }

    if (outing.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { error } = await supabase
      .from('outing_participants')
      .delete()
      .eq('outing_id', outingId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
