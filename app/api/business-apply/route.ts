import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizeCategory } from '@/lib/product'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { business_name, category, address, deal_offer, deal_details, contact_name, contact_email, phone } = body

    if (!business_name || !category || !address || !deal_offer || !contact_name || !contact_email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Normalize email to lowercase so business login always works regardless of how they typed it
    const normalizedEmail = contact_email.toLowerCase().trim()
    const normalizedCategory = normalizeCategory(category)

    const { error } = await supabase
      .from('business_applications')
      .insert([{
        business_name,
        category: normalizedCategory,
        address,
        deal_offer,
        deal_details: deal_details || null,
        contact_name,
        contact_email: normalizedEmail,
        phone,
        status: 'pending',
      }])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('business-apply error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}
