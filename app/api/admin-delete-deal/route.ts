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

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing deal id' }, { status: 400 })
    }

    const { error } = await supabase.from('deals').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to delete deal.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing deal id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('deals')
      .update({ active: false, admin_disabled: true, featured: false })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to archive deal.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
