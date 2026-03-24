'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Deal = {
  id: string
  business_name: string
  deal_description: string
  category: string
  address: string
  emoji: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Cafe: 'bg-amber-900 text-amber-300',
  Barber: 'bg-blue-900 text-blue-300',
  Fitness: 'bg-green-900 text-green-300',
  Nails: 'bg-pink-900 text-pink-300',
  Restaurant: 'bg-red-900 text-red-300',
}

export default function MemberDeals() {
  const [user, setUser] = useState<any>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/member/login')
        return
      }
      setUser(userData.user)

      const { data: dealsData, error } = await supabase
        .from('deals')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true })

      if (!error && dealsData) setDeals(dealsData)
      setLoading(false)
    }
    init()
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const categories = ['All', ...Array.from(new Set(deals.map(d => d.category)))]
  const filtered = filter === 'All' ? deals : deals.filter(d => d.category === filter)

  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-amber-400 text-xl animate-pulse">Loading your perks...</p>
        <p className="text-gray-600 text-sm mt-2">Getting Philly deals</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-black text-white">
          Perk<span className="text-amber-400">Pass</span>
        </h1>
        <button onClick={handleSignOut} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
          Sign out
        </button>
      </div>

      <div className="px-4 pt-6">
        <p className="text-gray-400 text-sm mb-1">Welcome back 👋</p>
        <h2 className="text-white text-2xl font-bold mb-2">Your Philly Deals</h2>
        <p className="text-gray-600 text-sm mb-6">
          {deals.length} active deals · Tap any to redeem
        </p>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                filter === cat
                  ? 'bg-amber-400 text-black'
                  : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Deals list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎟️</p>
            <p className="text-gray-400">No deals in this category yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(deal => (
              <div
                key={deal.id}
                className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4 border border-gray-800 hover:border-amber-400 transition-all"
              >
                <div className="text-4xl w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  {deal.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[deal.category] || 'bg-gray-800 text-gray-300'}`}>
                      {deal.category}
                    </span>
                  </div>
                  <p className="text-white font-bold truncate">{deal.business_name}</p>
                  <p className="text-amber-400 text-sm font-medium">{deal.deal_description}</p>
                  <p className="text-gray-600 text-xs mt-0.5">📍 {deal.address}</p>
                </div>
                <a
                  href={`/member/redeem?id=${deal.id}&biz=${encodeURIComponent(deal.business_name)}&deal=${encodeURIComponent(deal.deal_description)}`}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-4 py-2 rounded-xl text-sm flex-shrink-0 transition-all active:scale-95"
                >
                  Redeem
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}