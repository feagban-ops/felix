import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Use service role client to bypass RLS for deletion
    const serviceClient = createServiceClient()

    // Delete user data in order (respecting foreign keys)
    await serviceClient.from('purchases').delete().eq('user_id', user.id)
    await serviceClient.from('outing_participants').delete().eq('user_id', user.id)

    const { data: userOutings } = await serviceClient
      .from('outings')
      .select('id')
      .eq('owner_id', user.id)

    const outingIds = (userOutings ?? []).map((o) => o.id)

    if (outingIds.length > 0) {
      await serviceClient.from('outing_bottles').delete().in('outing_id', outingIds)
    }

    await serviceClient.from('outings').delete().eq('owner_id', user.id)
    await serviceClient.from('cards').delete().eq('user_id', user.id)
    await serviceClient.from('friendships').delete().or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    await serviceClient.from('subscriptions').delete().eq('user_id', user.id)
    await serviceClient.from('profiles').delete().eq('id', user.id)

    // Delete auth user
    await serviceClient.auth.admin.deleteUser(user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
