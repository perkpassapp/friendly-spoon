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

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const oldBusinessName = typeof body.oldBusinessName === 'string' ? body.oldBusinessName.trim() : ''
    const newBusinessName = typeof body.business_name === 'string' ? body.business_name.trim() : ''
    const normalizedCategory = normalizeCategory(typeof body.category === 'string' ? body.category : '')
    const trimmedAddress = typeof body.address === 'string' ? body.address.trim() : ''
    const normalizedEmail = typeof body.contact_email === 'string' ? body.contact_email.trim().toLowerCase() : ''
    const trimmedDealOffer = typeof body.deal_offer === 'string' ? body.deal_offer.trim() : ''
    const trimmedDealDescription = typeof body.deal_description === 'string' ? body.deal_description.trim() : ''
    const primaryDealId = typeof body.primaryDealId === 'string' ? body.primaryDealId : ''

    if (!oldBusinessName || !newBusinessName || !normalizedCategory || !trimmedAddress || !normalizedEmail) {
      return NextResponse.json({ success: false, error: 'Missing required business fields.' }, { status: 400 })
    }

    const accountUpdate = {
      business_name: newBusinessName,
      category: normalizedCategory,
      address: trimmedAddress,
      contact_email: normalizedEmail,
      deal_offer: trimmedDealOffer || null,
    }

    const [accountsResult, dealsResult, redemptionsResult, applicationsResult] = await Promise.all([
      supabase.from('business_accounts').update(accountUpdate).eq('business_name', oldBusinessName),
      supabase.from('deals').update({
        business_name: newBusinessName,
        category: normalizedCategory,
        address: trimmedAddress,
      }).eq('business_name', oldBusinessName),
      supabase.from('redemptions').update({
        business_name: newBusinessName,
      }).eq('business_name', oldBusinessName),
      supabase.from('business_applications').update({
        business_name: newBusinessName,
        category: normalizedCategory,
        address: trimmedAddress,
        contact_email: normalizedEmail,
        deal_offer: trimmedDealOffer || null,
      }).eq('business_name', oldBusinessName),
    ])

    for (const result of [accountsResult, dealsResult, redemptionsResult, applicationsResult]) {
      if (result.error) {
        return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })
      }
    }

    if (primaryDealId && trimmedDealDescription) {
      const { error: primaryDealError } = await supabase
        .from('deals')
        .update({ deal_description: trimmedDealDescription })
        .eq('id', primaryDealId)

      if (primaryDealError) {
        return NextResponse.json({ success: false, error: primaryDealError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to save business changes.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
