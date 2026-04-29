export type Screen = 'login' | 'deals' | 'favorites' | 'history' | 'account'

export type Deal = {
  id: string
  businessName: string
  offer: string
  category: string
  neighborhood: string
  availability: string
  photoUrl?: string | null
  address?: string | null
  featured?: boolean
  schedule?: {
    days: number[]
    start: string
    end: string
  } | null
}

export type MemberStatus = {
  exists: boolean
  active: boolean
  hasPhone: boolean
  name: string
  phone: string
  subscriptionStatus: string | null
}

export type RedemptionHistoryItem = {
  id: string
  businessName: string
  deal: string
  date: string
  status: 'Confirmed' | 'Code generated'
}

export type ActiveRedemption = {
  id?: string
  deal: Deal
  code: string
  expiresAt: number
  persisted?: boolean
  status?: 'live' | 'confirmed' | 'expired'
}
