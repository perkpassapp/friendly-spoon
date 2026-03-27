import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { business_name, category, address, deal_offer, contact_name, contact_email, phone } = body

    if (!business_name || !category || !address || !deal_offer || !contact_name || !contact_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabase.from('business_applications').insert({
      business_name, category, address, deal_offer,
      contact_name, contact_email, phone,
      status: 'pending'
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Business apply error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}