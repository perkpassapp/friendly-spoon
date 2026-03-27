import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ valid: false, reason: 'No code provided' })

    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('redemptions')
      .select('*')
      .eq('code', code.toUpperCase())
      .gte('redeemed_at', twoMinsAgo)
      .limit(1)

    if (error) return NextResponse.json({ valid: false, reason: 'Database error' })
    if (!data || data.length === 0) return NextResponse.json({ valid: false, reason: 'Code expired or not found' })

    const redemption = data[0]

    await supabase
      .from('redemptions')
      .update({ used_at: new Date().toISOString() })
      .eq('code', code.toUpperCase())

    return NextResponse.json({
      valid: true,
      business: redemption.business_name,
      deal: redemption.deal_description,
      member: redemption.member_email,
    })
  } catch (err) {
    console.error('Validate code error:', err)
    return NextResponse.json({ valid: false, reason: 'Server error' })
  }
}