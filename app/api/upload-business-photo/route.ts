import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    const businessId = formData.get('business_id') as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No photo provided' }, { status: 400 })
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

    const folder = businessId ? `businesses/${businessId}` : 'applications'
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${folder}/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('business-photos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) throw error

    const { data: publicUrlData } = supabase.storage
      .from('business-photos')
      .getPublicUrl(data.path)

    return NextResponse.json({ success: true, photo_url: publicUrlData.publicUrl })
  } catch (err) {
    console.error('upload-business-photo error:', err)
    return NextResponse.json(
      { success: false, error: 'Photo upload failed. Try again.' },
      { status: 500 }
    )
  }
}
