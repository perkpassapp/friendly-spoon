import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAdmin(req: NextRequest) {
  const password = req.headers.get('x-admin-password')
  return password === (process.env.ADMIN_PASSWORD || 'perkpassadmin')
}

function normalizeReferralCode(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
}

function normalizeHandle(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.startsWith('@') ? trimmed : '@' + trimmed
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [creatorsRes, referralsRes] = await Promise.all([
    supabase.from('creator_affiliates').select('*').order('created_at', { ascending: false }),
    supabase.from('creator_referrals').select('*, creator_affiliates(name, handle)').order('created_at', { ascending: false }),
  ])

  if (creatorsRes.error) {
    return NextResponse.json({ error: creatorsRes.error.message }, { status: 500 })
  }

  if (referralsRes.error) {
    return NextResponse.json({ error: referralsRes.error.message }, { status: 500 })
  }

  return NextResponse.json({
    creators: creatorsRes.data || [],
    referrals: referralsRes.data || [],
  })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, handle, referral_code, payout_email } = await req.json()
  const creatorName = typeof name === 'string' ? name.trim() : ''
  const referralCode = typeof referral_code === 'string' ? normalizeReferralCode(referral_code) : ''

  if (!creatorName || !referralCode) {
    return NextResponse.json({ error: 'Creator name and referral code are required.' }, { status: 400 })
  }

  const { error } = await supabase.from('creator_affiliates').insert({
    name: creatorName,
    handle: typeof handle === 'string' ? normalizeHandle(handle) : null,
    referral_code: referralCode,
    payout_email: typeof payout_email === 'string' ? payout_email.trim().toLowerCase() || null : null,
    status: 'active',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (body.type === 'creator-status') {
    const status = body.status === 'paused' ? 'paused' : 'active'
    const { error } = await supabase
      .from('creator_affiliates')
      .update({ status })
      .eq('id', body.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  if (body.type === 'referral-payout') {
    const allowed = ['pending', 'approved', 'paid', 'rejected']
    if (!allowed.includes(body.payout_status)) {
      return NextResponse.json({ error: 'Invalid payout status.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('creator_referrals')
      .update({ payout_status: body.payout_status })
      .eq('id', body.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
