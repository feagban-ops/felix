import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { Database } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if user already has an active subscription
    const { data: activeSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
      .overrideTypes<Database['public']['Tables']['subscriptions']['Row'], { merge: false }>()

    if (activeSubscription) {
      return NextResponse.json({ error: 'Abonnement déjà actif' }, { status: 400 })
    }

    // Get or create Stripe customer - reuse an existing customer id from
    // any previous subscription record (even inactive/cancelled) if present
    const { data: anySubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    let customerId = anySubscription?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id
    }

    // Create checkout session
    const priceId = process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY
    if (!priceId) {
      return NextResponse.json({ error: 'Configuration Stripe manquante' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile?subscription=canceled`,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
