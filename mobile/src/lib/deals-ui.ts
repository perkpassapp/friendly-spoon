import type { Deal } from '../types'

export const CATEGORY_META: Record<string, { emoji: string; label: string; photo: string }> = {
  Cafe: { emoji: '☕', label: 'Cafe', photo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=75' },
  Restaurant: { emoji: '🍽️', label: 'Restaurant', photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=75' },
  Dessert: { emoji: '🍰', label: 'Dessert', photo: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=75' },
  Barber: { emoji: '✂️', label: 'Barber', photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=75' },
  Fitness: { emoji: '🏋️', label: 'Fitness', photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=75' },
  Nails: { emoji: '💅', label: 'Nails', photo: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=75' },
  Sport: { emoji: '🏓', label: 'Sport', photo: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75' },
  Wellness: { emoji: '🧘', label: 'Wellness', photo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=75' },
  Retail: { emoji: '🛍️', label: 'Retail', photo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=75' },
  Other: { emoji: '🎟️', label: 'Other', photo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=75' },
}

export type BusinessGroup = {
  businessName: string
  category: string
  neighborhood: string
  photoUrl?: string | null
  deals: Deal[]
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '').slice(0, 10)
  if (digits.length !== 10) return phone
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function generateRedemptionCode(deal: Deal) {
  const base = deal.businessName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'PERK'
  const digits = String(Math.floor(1000 + Math.random() * 9000))
  return `${base}-${digits}`
}

export function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatHistoryDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function isDealOnCooldown(deal: Deal, cooldowns: Record<string, number>, now: number) {
  return Boolean(cooldowns[deal.id] && cooldowns[deal.id] > now)
}

export function normalizeCategory(category: string) {
  const normalized = category.trim().toLowerCase()
  const aliases: Record<string, string> = {
    cafe: 'Cafe',
    restaurant: 'Restaurant',
    dessert: 'Dessert',
    bakery: 'Dessert',
    icecream: 'Dessert',
    'ice cream': 'Dessert',
    'dessert shop': 'Dessert',
    barber: 'Barber',
    fitness: 'Fitness',
    nails: 'Nails',
    'nail salon': 'Nails',
    sport: 'Sport',
    pickleball: 'Sport',
    wellness: 'Wellness',
    retail: 'Retail',
    'self-care': 'Wellness',
    'self care': 'Wellness',
  }
  return aliases[normalized] || 'Other'
}

export function groupDeals(deals: Deal[]): BusinessGroup[] {
  const map = new Map<string, BusinessGroup>()
  deals.forEach((deal) => {
    if (!map.has(deal.businessName)) {
      map.set(deal.businessName, {
        businessName: deal.businessName,
        category: normalizeCategory(deal.category),
        neighborhood: deal.neighborhood,
        photoUrl: deal.photoUrl,
        deals: [],
      })
    }
    map.get(deal.businessName)?.deals.push(deal)
  })
  return Array.from(map.values()).sort((a, b) => {
    const aFeatured = a.deals.some((deal) => deal.featured)
    const bFeatured = b.deals.some((deal) => deal.featured)
    if (aFeatured === bFeatured) return a.businessName.localeCompare(b.businessName)
    return aFeatured ? -1 : 1
  })
}

export function isDealAvailableOnDay(deal: Deal, day: number) {
  if (!deal.schedule) return true
  return deal.schedule.days.includes(day)
}

export function isScheduleActive(deal: Deal) {
  if (!deal.schedule) return true
  const now = new Date()
  if (!deal.schedule.days.includes(now.getDay())) return false
  const [startHour, startMinute] = deal.schedule.start.split(':').map(Number)
  const [endHour, endMinute] = deal.schedule.end.split(':').map(Number)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  return nowMinutes >= startMinutes && nowMinutes < endMinutes
}

export function formatScheduleTime(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}${minute ? ':' + String(minute).padStart(2, '0') : ''}${ampm}`
}

export function scheduleLabel(deal: Deal) {
  if (!deal.schedule) return ''
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = deal.schedule.days.length === 7
    ? 'Daily'
    : deal.schedule.days.map((day) => dayLabels[day]).join(', ')
  return `${days} ${formatScheduleTime(deal.schedule.start)}-${formatScheduleTime(deal.schedule.end)}`
}

export function getAvailabilityLabel(deal: Deal) {
  if (!deal.schedule) return 'Available anytime'
  if (isScheduleActive(deal)) return 'Available now'
  const today = new Date().getDay()
  if (deal.schedule.days.includes(today)) {
    return `Today ${formatScheduleTime(deal.schedule.start)}-${formatScheduleTime(deal.schedule.end)}`
  }
  const nextDay = deal.schedule.days[0]
  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return `Next ${dayLabels[nextDay]} ${formatScheduleTime(deal.schedule.start)}`
}
