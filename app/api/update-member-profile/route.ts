import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '').slice(0, 10)
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, phone } = await req.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    const normalizedPhone = typeof phone === 'string' ? normalizePhone(phone) : ''

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    if (normalizedPhone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 })
    }

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

    const payload: { email: string; name?: string; phone: string } = {
      email: normalizedEmail,
      phone: normalizedPhone,
    }

    if (normalizedName) {
      payload.name = normalizedName
    }

    const { error } = await supabase
      .from('members')
      .upsert(payload, { onConflict: 'email' })

    if (error) {
      throw error
    }

    return NextResponse.json({ ok: true, phone: normalizedPhone })
  } catch (error) {
    console.error('Update member profile error:', error)
    return NextResponse.json({ error: 'Unable to save profile.' }, { status: 500 })
  }
}
