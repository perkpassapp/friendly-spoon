import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('ref')?.trim().toLowerCase()

  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('creator_affiliates')
    .select('id, name, handle, referral_code, status')
    .ilike('referral_code', code)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    console.error('creator affiliate lookup error:', error)
    return NextResponse.json({ valid: false }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ valid: false }, { status: 404 })
  }

  return NextResponse.json({
    valid: true,
    affiliate: {
      id: data.id,
      name: data.name,
      handle: data.handle,
      referralCode: data.referral_code,
    },
  })
}
