import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({
      exists: false,
      active: false,
      hasPhone: false,
      name: '',
      phone: '',
      subscriptionStatus: null,
    })
  }

  const { data } = await supabase
    .from('members')
    .select('email, name, phone, subscription_status')
    .eq('email', email)
    .maybeSingle()

  const phone = typeof data?.phone === 'string' ? data.phone : ''
  const subscriptionStatus =
    typeof data?.subscription_status === 'string' ? data.subscription_status : null

  return NextResponse.json({
    exists: !!data,
    active: subscriptionStatus === 'active',
    hasPhone: !!phone,
    name: data?.name || '',
    phone,
    subscriptionStatus,
  })
}
