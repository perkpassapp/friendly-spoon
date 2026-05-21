import { hasSupabaseConfig } from '../lib/env'
import { supabase } from '../lib/supabase'
import type { Deal } from '../types'

type DealRow = {
  id: string
  business_name: string | null
  deal_description: string | null
  category: string | null
  address: string | null
  photo_url: string | null
  featured: boolean | null
  schedule: {
    days?: number[]
    start?: string
    end?: string
  } | null
}

export async function loadDeals(): Promise<{ deals: Deal[]; source: 'live'; error?: string }> {
  if (!hasSupabaseConfig) {
    return { deals: [], source: 'live', error: 'Supabase is not configured for this build.' }
  }

  if (!supabase) {
    return { deals: [], source: 'live', error: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase
    .from('deals')
    .select('id, business_name, deal_description, category, address, photo_url, featured, schedule')
    .eq('active', true)
    .eq('admin_disabled', false)
    .order('created_at')

  if (error) {
    return { deals: [], source: 'live', error: error.message }
  }

  const liveDeals = (data || [])
    .map(mapDealRow)
    .filter((deal): deal is Deal => Boolean(deal))

  if (!liveDeals.length) {
    return { deals: [], source: 'live', error: 'No live deals returned yet.' }
  }

  return { deals: liveDeals, source: 'live' }
}

function mapDealRow(row: DealRow): Deal | null {
  if (!row.id || !row.business_name || !row.deal_description) return null

  return {
    id: row.id,
    businessName: row.business_name,
    offer: row.deal_description,
    category: row.category || 'Local deal',
    neighborhood: getNeighborhood(row.address),
    availability: getAvailability(row.schedule),
    photoUrl: row.photo_url,
    address: row.address,
    featured: Boolean(row.featured),
    schedule: normalizeSchedule(row.schedule),
  }
}

function getNeighborhood(address: string | null) {
  if (!address) return 'Philadelphia'
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean)
  return parts[1] || parts[0] || 'Philadelphia'
}

function getAvailability(schedule: DealRow['schedule']) {
  if (!schedule?.days?.length) return 'Available this week'
  if (schedule.days.length === 7) return 'Available daily'
  return schedule.days.join(', ')
}

function normalizeSchedule(schedule: DealRow['schedule']): Deal['schedule'] {
  if (!schedule?.days?.length || !schedule.start || !schedule.end) return null
  return {
    days: schedule.days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    start: schedule.start,
    end: schedule.end,
  }
}
