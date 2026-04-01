import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role key bypasses RLS — safe here because this is server-side only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing deal id' }, { status: 400 })
    }

    const { error } = await supabase.from('deals').delete().eq('id', id)

    if (error) {
      console.error('admin-delete-deal error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('admin-delete-deal error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}