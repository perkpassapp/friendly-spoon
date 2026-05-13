import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const [{ data: deals, error: dealsError }, { data: applications, error: applicationsError }] = await Promise.all([
    supabase
      .from('deals')
      .select('*')
      .eq('active', true)
      .eq('admin_disabled', false)
      .order('created_at'),
    supabase
      .from('business_applications')
      .select('business_name, status'),
  ])

  if (dealsError) {
    return NextResponse.json({ error: dealsError.message }, { status: 500 })
  }

  if (applicationsError) {
    return NextResponse.json({ error: applicationsError.message }, { status: 500 })
  }

  const pendingBusinesses = new Set(
    (applications || [])
      .filter((application) => (application.status || 'pending') === 'pending')
      .map((application) => application.business_name.trim().toLowerCase())
  )

  const visibleDeals = (deals || []).filter((deal) => !pendingBusinesses.has(deal.business_name.trim().toLowerCase()))

  return NextResponse.json({ deals: visibleDeals })
}
