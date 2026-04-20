import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type BillingInterval = 'monthly' | 'annual'

export async function POST(req: NextRequest) {
  try {
    const { email, name, phone, billingInterval, creatorRef } = await req.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const normalizedPhone = typeof phone === 'string' ? phone.replace(/\D/g, '').slice(0, 10) : ''
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    const selectedBillingInterval: BillingInterval = billingInterval === 'annual' ? 'annual' : 'monthly'
    const normalizedCreatorRef = typeof creatorRef === 'string' ? creatorRef.trim().toLowerCase() : ''
    let creatorAffiliate: { id: string; referral_code: string } | null = null

    if (normalizedEmail) {
      const { data: existing } = await supabase
        .from('members')
        .select('email, subscription_status')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (existing?.subscription_status === 'active') {
        return NextResponse.json(
          { error: 'This account already has an active membership. Please log in instead.' },
          { status: 409 }
        )
      }
    }

    if (normalizedPhone) {
      const { data: phoneOwner } = await supabase
        .from('members')
        .select('email')
        .eq('phone', normalizedPhone)
        .neq('email', normalizedEmail)
        .limit(1)

      if (phoneOwner?.length) {
        return NextResponse.json(
          { error: 'That phone number is already tied to another account.' },
          { status: 409 }
        )
      }
    }

    if (selectedBillingInterval === 'annual') {
      if (!normalizedCreatorRef) {
        return NextResponse.json(
          { error: 'Annual access is currently available through creator referral links only.' },
          { status: 400 }
        )
      }

      const { data: affiliate, error: affiliateError } = await supabase
        .from('creator_affiliates')
        .select('id, referral_code')
        .ilike('referral_code', normalizedCreatorRef)
        .eq('status', 'active')
        .maybeSingle()

      if (affiliateError) throw affiliateError

      if (!affiliate) {
        return NextResponse.json(
          { error: 'This creator referral link is not active.' },
          { status: 400 }
        )
      }

      creatorAffiliate = affiliate
    }

    // Store or refresh member info before checkout
    if (normalizedEmail) {
      await supabase.from('members').upsert({
        email: normalizedEmail,
        name: normalizedName || null,
        phone: normalizedPhone || null,
      }, { onConflict: 'email' })
    }

    const lineItem = selectedBillingInterval === 'annual'
      ? process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID
        ? { price: process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID, quantity: 1 }
        : {
            price_data: {
              currency: 'usd',
              unit_amount: 3000,
              recurring: { interval: 'year' as const },
              product_data: {
                name: 'PerkPass All Access',
                description: 'Creator-exclusive annual membership for Philly local perks.',
              },
            },
            quantity: 1,
          }
      : { price: process.env.STRIPE_PRICE_ID!, quantity: 1 }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: normalizedEmail,
      line_items: [lineItem],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?email=${encodeURIComponent(normalizedEmail)}`,
      allow_promotion_codes: true,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup`,
      metadata: {
        email: normalizedEmail,
        name: normalizedName,
        phone: normalizedPhone,
        billing_interval: selectedBillingInterval,
        creator_ref: creatorAffiliate?.referral_code || '',
        creator_id: creatorAffiliate?.id || '',
        commission_amount: creatorAffiliate ? '500' : '0',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    const message = error instanceof Error ? error.message : 'Something went wrong.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
