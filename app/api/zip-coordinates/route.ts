import { NextRequest, NextResponse } from 'next/server'
import { geocodeZipCode } from '@/lib/geocoding'
import { isValidUsZipCode, normalizeUsZipCode } from '@/lib/location'

export async function POST(req: NextRequest) {
  try {
    const { zip } = await req.json()
    const normalizedZip = normalizeUsZipCode(typeof zip === 'string' ? zip : '')

    if (!isValidUsZipCode(normalizedZip)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 5-digit ZIP code.' },
        { status: 400 }
      )
    }

    const coordinates = await geocodeZipCode(normalizedZip)
    if (!coordinates) {
      return NextResponse.json(
        { success: false, error: 'We could not find that ZIP code.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      zip: normalizedZip,
      coordinates,
    })
  } catch (error) {
    console.error('zip-coordinates error:', error)
    return NextResponse.json(
      { success: false, error: 'Location search is unavailable right now.' },
      { status: 500 }
    )
  }
}
