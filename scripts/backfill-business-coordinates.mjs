import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN

if (!supabaseUrl || !serviceRoleKey || !mapboxAccessToken) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MAPBOX_ACCESS_TOKEN')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function geocodeAddress(address) {
  const params = new URLSearchParams({
    q: address,
    access_token: mapboxAccessToken,
    limit: '1',
    autocomplete: 'false',
    country: 'US',
    permanent: 'true',
  })

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed with status ${response.status}`)
  }

  const data = await response.json()
  const coordinates = data.features?.[0]?.geometry?.coordinates
  if (!coordinates || coordinates.length < 2) return null

  return {
    latitude: coordinates[1],
    longitude: coordinates[0],
  }
}

async function getRowsMissingCoordinates(table) {
  const { data, error } = await supabase
    .from(table)
    .select('id, business_name, address, latitude, longitude')
    .or('latitude.is.null,longitude.is.null')

  if (error) throw error
  return data || []
}

async function updateById(table, id, coordinates) {
  const { error } = await supabase
    .from(table)
    .update(coordinates)
    .eq('id', id)

  if (error) throw error
}

async function updateDealsByBusinessName(businessName, coordinates) {
  const { error } = await supabase
    .from('deals')
    .update(coordinates)
    .eq('business_name', businessName)
    .or('latitude.is.null,longitude.is.null')

  if (error) throw error
}

async function main() {
  const applications = await getRowsMissingCoordinates('business_applications')
  const businesses = await getRowsMissingCoordinates('business_accounts')
  const deals = await getRowsMissingCoordinates('deals')

  const rows = [...businesses, ...applications, ...deals]
  const addresses = Array.from(
    new Map(
      rows
        .filter((row) => row.address && row.business_name)
        .map((row) => [`${row.business_name}::${row.address}`, {
          businessName: row.business_name,
          address: row.address,
        }])
    ).values()
  )

  console.log(`Found ${addresses.length} unique business addresses to geocode`)

  let updatedBusinesses = 0
  let updatedApplications = 0
  let updatedDeals = 0
  let skipped = 0

  for (const entry of addresses) {
    process.stdout.write(`Geocoding ${entry.businessName}... `)

    try {
      const coordinates = await geocodeAddress(entry.address)
      if (!coordinates) {
        skipped += 1
        console.log('no match')
        continue
      }

      const businessMatches = businesses.filter(
        (row) => row.business_name === entry.businessName && row.address === entry.address
      )
      const applicationMatches = applications.filter(
        (row) => row.business_name === entry.businessName && row.address === entry.address
      )

      for (const row of businessMatches) {
        await updateById('business_accounts', row.id, coordinates)
        updatedBusinesses += 1
      }

      for (const row of applicationMatches) {
        await updateById('business_applications', row.id, coordinates)
        updatedApplications += 1
      }

      await updateDealsByBusinessName(entry.businessName, coordinates)
      updatedDeals += deals.filter((row) => row.business_name === entry.businessName).length

      console.log(`ok (${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)})`)
      await sleep(150)
    } catch (error) {
      skipped += 1
      console.log('failed')
      console.error(error)
    }
  }

  console.log('')
  console.log('Backfill complete')
  console.log(`business_accounts updated: ${updatedBusinesses}`)
  console.log(`business_applications updated: ${updatedApplications}`)
  console.log(`deals updated: ${updatedDeals}`)
  console.log(`skipped: ${skipped}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
