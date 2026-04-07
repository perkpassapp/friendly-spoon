export type Coordinates = {
  latitude: number
  longitude: number
}

export function normalizeUsZipCode(zip: string): string {
  return zip.trim().slice(0, 5)
}

export function isValidUsZipCode(zip: string): boolean {
  return /^\d{5}$/.test(normalizeUsZipCode(zip))
}

export function hasCoordinates(value: {
  latitude?: number | null
  longitude?: number | null
}): value is Coordinates {
  return typeof value.latitude === 'number' && typeof value.longitude === 'number'
}

export function getDistanceMiles(from: Coordinates, to: Coordinates): number {
  const earthRadiusMiles = 3958.8
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const latitudeDiff = toRadians(to.latitude - from.latitude)
  const longitudeDiff = toRadians(to.longitude - from.longitude)
  const fromLatitude = toRadians(from.latitude)
  const toLatitude = toRadians(to.latitude)

  const a =
    Math.sin(latitudeDiff / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDiff / 2) ** 2

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a))
}
