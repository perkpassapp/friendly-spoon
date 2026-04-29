import { supabase } from '../lib/supabase'
import type { Deal, RedemptionHistoryItem } from '../types'

export type RedemptionRow = {
  id: string
  business_name: string | null
  deal_description: string | null
  deal_id: string | null
  code: string | null
  redeemed_at: string
  validated_at: string | null
}

export async function loadRedemptions(memberEmail: string): Promise<RedemptionRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('redemptions')
    .select('id, business_name, deal_description, deal_id, code, redeemed_at, validated_at')
    .eq('member_email', memberEmail.toLowerCase())
    .order('redeemed_at', { ascending: false })
    .limit(25)

  if (error) throw error
  return (data || []) as RedemptionRow[]
}

export async function createRedemption(memberEmail: string, deal: Deal, code: string): Promise<RedemptionRow> {
  if (!supabase) {
    throw new Error('Supabase is not configured for the mobile app yet.')
  }

  const { data, error } = await supabase
    .from('redemptions')
    .insert({
      member_email: memberEmail.toLowerCase(),
      business_name: deal.businessName,
      deal_description: deal.offer,
      deal_id: deal.id,
      code,
      redeemed_at: new Date().toISOString(),
    })
    .select('id, business_name, deal_description, deal_id, code, redeemed_at, validated_at')
    .single()

  if (error) throw error
  return data as RedemptionRow
}

export async function getRedemptionById(redemptionId: string): Promise<RedemptionRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('redemptions')
    .select('id, business_name, deal_description, deal_id, code, redeemed_at, validated_at')
    .eq('id', redemptionId)
    .maybeSingle()

  if (error) throw error
  return (data as RedemptionRow | null) || null
}

export function mapRedemptionHistory(row: RedemptionRow): RedemptionHistoryItem {
  return {
    id: row.id,
    businessName: row.business_name || 'PerkPass business',
    deal: row.deal_description || 'Local deal',
    date: formatHistoryDate(row.redeemed_at),
    status: row.validated_at ? 'Confirmed' : 'Code generated',
  }
}

function formatHistoryDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
