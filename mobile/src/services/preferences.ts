import AsyncStorage from '@react-native-async-storage/async-storage'

function favoritesKey(scope: string) {
  return `perkpass:favorites:${scope}`
}

export async function loadFavoriteBusinesses(scope: string) {
  const raw = await AsyncStorage.getItem(favoritesKey(scope))
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

export async function saveFavoriteBusinesses(scope: string, businesses: string[]) {
  await AsyncStorage.setItem(favoritesKey(scope), JSON.stringify(businesses))
}
