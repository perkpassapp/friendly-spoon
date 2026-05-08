import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  const [membersRes, redemptionsRes, dealsRes] = await Promise.all([
    supabase.from('members').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('redemptions').select('id', { count: 'exact', head: true }),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('active', true).eq('admin_disabled', false),
  ])

  if (membersRes.error) {
    return NextResponse.json({ error: membersRes.error.message }, { status: 500 })
  }

  if (redemptionsRes.error) {
    return NextResponse.json({ error: redemptionsRes.error.message }, { status: 500 })
  }

  if (dealsRes.error) {
    return NextResponse.json({ error: dealsRes.error.message }, { status: 500 })
  }

  return NextResponse.json({
    members: membersRes.count || 0,
    redemptions: redemptionsRes.count || 0,
    deals: dealsRes.count || 0,
  })
}
