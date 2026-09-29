import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Configuration webhook manquante' }, { status: 500 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.userId

        if (userId && session.subscription) {
          // Retrieve full subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

          // Create or update subscription
          const upsertPayload: Database['public']['Tables']['subscriptions']['Insert'] = {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            plan: 'premium_monthly',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }
          const { error } = await serviceClient
            .from('subscriptions')
            .upsert(upsertPayload)

          if (error) {
            console.error('Subscription creation error:', error)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.userId

        if (userId) {
          const updatePayload: Database['public']['Tables']['subscriptions']['Update'] = {
            status: subscription.status as any,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }
          const { error } = await serviceClient
            .from('subscriptions')
            .update(updatePayload)
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Subscription update error:', error)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any

        const updatePayload: Database['public']['Tables']['subscriptions']['Update'] = {
          status: 'canceled',
        }
        const { error } = await serviceClient
          .from('subscriptions')
          .update(updatePayload)
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Subscription deletion error:', error)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription

        // Update subscription status to active
        const updatePayload: Database['public']['Tables']['subscriptions']['Update'] = {
          status: 'active',
        }
        const { error } = await serviceClient
          .from('subscriptions')
          .update(updatePayload)
          .eq('stripe_subscription_id', subscriptionId)

        if (error) {
          console.error('Invoice payment success error:', error)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription

        // Update subscription status to past_due
        const updatePayload: Database['public']['Tables']['subscriptions']['Update'] = {
          status: 'past_due',
        }
        const { error } = await serviceClient
          .from('subscriptions')
          .update(updatePayload)
          .eq('stripe_subscription_id', subscriptionId)

        if (error) {
          console.error('Invoice payment failed error:', error)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
