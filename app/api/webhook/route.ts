import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Required: tell Next.js to give us the raw body for Stripe signature verification
export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {

      // Member completes checkout — subscription is live
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email = session.customer_email || session.metadata?.email
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

        if (email) {
          await supabase
            .from('members')
            .update({
              stripe_customer_id: customerId ?? null,
              stripe_subscription_id: subscriptionId ?? null,
              subscription_status: 'active',
            })
            .eq('email', email.toLowerCase())
        }
        break
      }

      // Subscription renewed successfully
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (customerId) {
          await supabase
            .from('members')
            .update({ subscription_status: 'active' })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      // Payment failed on renewal
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (customerId) {
          await supabase
            .from('members')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      // Subscription cancelled or expired
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
        if (customerId) {
          await supabase
            .from('members')
            .update({ subscription_status: 'cancelled' })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      // Subscription updated (e.g. reactivated after past_due)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
        if (customerId) {
          const status = subscription.status === 'active' ? 'active'
            : subscription.status === 'past_due' ? 'past_due'
            : subscription.status === 'canceled' ? 'cancelled'
            : subscription.status
          await supabase
            .from('members')
            .update({ subscription_status: status })
            .eq('stripe_customer_id', customerId)
        }
        break
      }
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err)
    // Still return 200 so Stripe doesn't keep retrying for non-critical errors
  }

  return NextResponse.json({ received: true })
}
