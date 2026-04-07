export const REDEMPTION_CODE_TTL_SECONDS = 2 * 60
export const REDEMPTION_COOLDOWN_SECONDS = 15 * 60

export const REDEMPTION_RULES = [
  { value: `${REDEMPTION_CODE_TTL_SECONDS / 60} min`, label: 'Window' },
  { value: `${REDEMPTION_COOLDOWN_SECONDS / 60} min`, label: 'Cooldown' },
  { value: 'Single use', label: 'Per unlock' },
] as const

export const CATEGORY_OPTIONS = [
  'Cafe',
  'Restaurant',
  'Barber',
  'Fitness',
  'Nails',
  'Sport',
  'Wellness',
  'Retail',
  'Other',
] as const

export type Category = (typeof CATEGORY_OPTIONS)[number]

type CategoryMeta = {
  emoji: string
  photo: string
  color?: {
    bg: string
    color: string
  }
}

const CATEGORY_ALIAS_MAP: Record<string, Category> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  barber: 'Barber',
  fitness: 'Fitness',
  nails: 'Nails',
  'nail salon': 'Nails',
  sport: 'Sport',
  pickleball: 'Sport',
  wellness: 'Wellness',
  retail: 'Retail',
  other: 'Other',
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Cafe: {
    emoji: '☕',
    photo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=75',
    color: { bg: '#FFF3CD', color: '#92600A' },
  },
  Restaurant: {
    emoji: '🍽️',
    photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=75',
    color: { bg: '#FDE8E8', color: '#8B1A1A' },
  },
  Barber: {
    emoji: '✂️',
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=75',
    color: { bg: '#E8F4FD', color: '#1A6B9E' },
  },
  Fitness: {
    emoji: '🏋️',
    photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=75',
    color: { bg: '#E8F8EF', color: '#1A6B3E' },
  },
  Nails: {
    emoji: '💅',
    photo: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=75',
    color: { bg: '#FCE8F3', color: '#8B1A5E' },
  },
  Sport: {
    emoji: '🏓',
    photo: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75',
    color: { bg: '#EDE8FD', color: '#4A1A8B' },
  },
  Wellness: {
    emoji: '🧘',
    photo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=75',
  },
  Retail: {
    emoji: '🛍️',
    photo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=75',
  },
  Other: {
    emoji: '🎟️',
    photo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=75',
  },
}

export function normalizeCategory(category: string | null | undefined): Category {
  const normalized = category?.trim().toLowerCase()
  if (!normalized) return 'Other'
  return CATEGORY_ALIAS_MAP[normalized] ?? 'Other'
}

export function getCategoryMeta(category: string | null | undefined): CategoryMeta {
  return CATEGORY_META[normalizeCategory(category)]
}

export function getCooldownRemainingSeconds(redeemedAt: string, now = Date.now()): number {
  const endsAt = new Date(redeemedAt).getTime() + REDEMPTION_COOLDOWN_SECONDS * 1000
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}
