import { createServerClient } from '../supabase/server'

export async function isPremium(userId: string): Promise<boolean> {
  const supabase = createServerClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return !!subscription
}

export async function getSubscription(userId: string) {
  const supabase = createServerClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return subscription
}
