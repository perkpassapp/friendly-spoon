import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const authVerifier = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) {
      return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 })
    }

    const {
      data: { user },
      error: userError,
    } = await authVerifier.auth.getUser(token)

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Unable to verify this session.' }, { status: 401 })
    }

    const body = await req.json()
    const requestEmail = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    const userEmail = normalizeEmail(user.email)

    if (!requestEmail || requestEmail !== userEmail) {
      return NextResponse.json({ error: 'Email verification failed.' }, { status: 403 })
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('stripe_subscription_id')
      .eq('email', userEmail)
      .maybeSingle()

    if (memberError) {
      throw memberError
    }

    if (member?.stripe_subscription_id) {
      await stripe.subscriptions.cancel(member.stripe_subscription_id)
    }

    const { error: redemptionsError } = await supabase
      .from('redemptions')
      .delete()
      .eq('member_email', userEmail)

    if (redemptionsError) {
      throw redemptionsError
    }

    const { error: referralError } = await supabase
      .from('creator_referrals')
      .delete()
      .eq('member_email', userEmail)

    if (referralError) {
      throw referralError
    }

    const { error: memberDeleteError } = await supabase
      .from('members')
      .delete()
      .eq('email', userEmail)

    if (memberDeleteError) {
      throw memberDeleteError
    }

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      throw authDeleteError
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Unable to delete this account right now. Please try again.' },
      { status: 500 }
    )
  }
}
