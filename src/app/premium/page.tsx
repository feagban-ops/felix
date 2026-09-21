import { createServerClient } from '@/lib/supabase/server'
import { isPremium, getSubscription } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import PremiumContent from './premium-content'

export default async function PremiumPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const premium = await isPremium(user.id)
  const subscription = await getSubscription(user.id)

  return <PremiumContent isPremiumUser={premium} subscription={subscription} />
}
