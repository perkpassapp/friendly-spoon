import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = 'message' in error ? error.message : null
    if (typeof maybeMessage === 'string' && maybeMessage) return maybeMessage
    const maybeError = 'error' in error ? error.error : null
    if (typeof maybeError === 'string' && maybeError) return maybeError
    return JSON.stringify(error)
  }
  return 'Photo update failed. Try again.'
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    const businessId = formData.get('business_id') as string | null
    const businessName = formData.get('business_name') as string | null

    if (!file || (!businessId && !businessName)) {
      return NextResponse.json(
        { success: false, error: 'Missing photo or business reference' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Photo must be a JPG, PNG, or WebP image' },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Photo must be under 5MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const folderId = businessId || (businessName ? businessName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : 'business')
    const filename = `businesses/${folderId}/photo-${Date.now()}.${ext}`

    // Upload to storage (upsert replaces existing)
    const { data, error: uploadError } = await supabase.storage
      .from('business-photos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from('business-photos')
      .getPublicUrl(data.path)

    // Timestamped paths avoid stale browser/CDN caches after replacing photos.
    const photoUrl = publicUrlData.publicUrl

    let resolvedBusinessName = businessName?.trim() || ''

    if (businessId) {
      const { data: accountRows, error: accountByIdError } = await supabase
        .from('business_accounts')
        .select('business_name')
        .eq('id', businessId)
        .limit(1)

      if (accountByIdError) throw accountByIdError
      if (accountRows?.[0]?.business_name) {
        resolvedBusinessName = accountRows[0].business_name
      }
    }

    if (!resolvedBusinessName) {
      return NextResponse.json(
        { success: false, error: 'Business record not found for this photo.' },
        { status: 404 }
      )
    }

    const { error: accountError } = await supabase
      .from('business_accounts')
      .update({ photo_url: photoUrl })
      .eq('business_name', resolvedBusinessName)

    if (accountError) throw accountError

    // 2. Update ALL deals for this business so /member/deals shows the same photo
    const { error: dealsError } = await supabase
      .from('deals')
      .update({ photo_url: photoUrl })
      .eq('business_name', resolvedBusinessName)

    if (dealsError) throw dealsError

    return NextResponse.json({ success: true, photo_url: photoUrl })
  } catch (err) {
    console.error('update-business-photo error:', err)
    const message = getErrorMessage(err)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
