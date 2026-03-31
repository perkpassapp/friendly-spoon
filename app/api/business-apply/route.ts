import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { business_name, category, address, deal_offer, contact_name, contact_email, phone } = body

    if (!business_name || !category || !address || !deal_offer || !contact_name || !contact_email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabase
      .from('business_applications')
      .insert([{ business_name, category, address, deal_offer, contact_name, contact_email, phone }])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('business-apply error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}