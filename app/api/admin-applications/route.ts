import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeCategory } from '@/lib/product'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAdmin(req: NextRequest) {
  const password = req.headers.get('x-admin-password')
  return password === (process.env.ADMIN_PASSWORD || 'perkpassadmin')
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('business_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ applications: data || [] })
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const id = typeof body.id === 'string' ? body.id : ''
  const action = body.action === 'approve' ? 'approve' : body.action === 'reject' ? 'reject' : ''

  if (!id || !action) {
    return NextResponse.json({ error: 'Application id and action are required.' }, { status: 400 })
  }

  const { data: application, error: applicationError } = await supabase
    .from('business_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (applicationError) {
    return NextResponse.json({ error: applicationError.message }, { status: 500 })
  }

  if (!application) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
  }

  if (action === 'reject') {
    const { error } = await supabase
      .from('business_applications')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  const category = normalizeCategory(application.category)

  const { data: existingAccount, error: existingAccountError } = await supabase
    .from('business_accounts')
    .select('photo_url')
    .eq('business_name', application.business_name)
    .maybeSingle()

  if (existingAccountError) {
    return NextResponse.json({ error: existingAccountError.message }, { status: 500 })
  }

  const photoUrl = existingAccount?.photo_url || null

  const { error: dealError } = await supabase.from('deals').insert({
    business_name: application.business_name,
    deal_description: application.deal_offer,
    deal_details: application.deal_details || null,
    category,
    emoji: '🎟️',
    address: application.address,
    active: true,
    admin_disabled: false,
    photo_url: photoUrl,
  })

  if (dealError) {
    return NextResponse.json({ error: dealError.message }, { status: 500 })
  }

  const { error: accountError } = await supabase.from('business_accounts').upsert({
    business_name: application.business_name,
    category,
    address: application.address,
    deal_offer: application.deal_offer,
    contact_email: application.contact_email.toLowerCase().trim(),
    active: true,
    admin_disabled: false,
  }, { onConflict: 'business_name' })

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 500 })
  }

  const { error: statusError } = await supabase
    .from('business_applications')
    .update({ status: 'approved' })
    .eq('id', id)

  if (statusError) {
    return NextResponse.json({ error: statusError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
