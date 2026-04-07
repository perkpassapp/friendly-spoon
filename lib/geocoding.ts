import { normalizeUsZipCode, type Coordinates } from '@/lib/location'

type MapboxFeature = {
  geometry?: {
    coordinates?: [number, number]
  }
}

type MapboxResponse = {
  features?: MapboxFeature[]
}

function getMapboxAccessToken(): string {
  const token = process.env.MAPBOX_ACCESS_TOKEN
  if (!token) {
    throw new Error('Missing MAPBOX_ACCESS_TOKEN')
  }
  return token
}

async function forwardGeocode(query: string, options?: {
  country?: string
  types?: string
  permanent?: boolean
}): Promise<Coordinates | null> {
  const token = getMapboxAccessToken()
  const params = new URLSearchParams({
    q: query,
    access_token: token,
    limit: '1',
    autocomplete: 'false',
  })

  if (options?.country) params.set('country', options.country)
  if (options?.types) params.set('types', options.types)
  if (options?.permanent) params.set('permanent', 'true')

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed with status ${response.status}`)
  }

  const data = (await response.json()) as MapboxResponse
  const coordinates = data.features?.[0]?.geometry?.coordinates

  if (!coordinates || coordinates.length < 2) return null

  return {
    latitude: coordinates[1],
    longitude: coordinates[0],
  }
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  return forwardGeocode(address, {
    country: 'US',
    permanent: true,
  })
}

export async function geocodeZipCode(zip: string): Promise<Coordinates | null> {
  return forwardGeocode(normalizeUsZipCode(zip), {
    country: 'US',
    types: 'postcode',
  })
}
