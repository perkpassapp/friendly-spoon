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
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/member/login'); return }

      const { data: dealsData, error } = await supabase
        .from('deals')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true })

      if (!error && dealsData) {
        setDeals(dealsData)

        // Check 24hr cooldowns for each deal
        const email = userData.user.email!
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: redemptions } = await supabase
          .from('redemptions')
          .select('deal_id, redeemed_at')
          .eq('member_email', email)
          .gte('redeemed_at', oneDayAgo)

        if (redemptions) {
          const cdMap: Record<string, number> = {}
          redemptions.forEach(r => {
            if (!r.deal_id) return
            const lastUsed = new Date(r.redeemed_at).getTime()
            const secsLeft = Math.ceil((lastUsed + 24 * 60 * 60 * 1000 - Date.now()) / 1000)
            if (secsLeft > 0) cdMap[r.deal_id] = secsLeft
          })
          setCooldowns(cdMap)
        }
      }
      setLoading(false)
    }
    init()
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function formatCooldown(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const categories = ['All', ...Array.from(new Set(deals.map(d => d.category)))]
  const filtered = filter === 'All' ? deals : deals.filter(d => d.category === filter)

  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-amber-400 text-xl animate-pulse">Loading your perks...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-black pb-20">
      {/* Confirmation overlay */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm border border-gray-700 mb-4">
            {/* Deal info */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{selectedDeal.emoji}</div>
              <h3 className="text-white font-black text-xl mb-1">{selectedDeal.business_name}</h3>
              <p className="text-amber-400 font-bold text-lg">{selectedDeal.deal_description}</p>
              <p className="text-gray-500 text-sm mt-1">📍 {selectedDeal.address}</p>
            </div>

            {/* Warning info */}
            <div className="bg-black rounded-2xl p-4 mb-6 space-y-3 border border-gray-800">
              <div className="flex items-start gap-3">
                <span className="text-xl">⏱️</span>
                <div>
                  <p className="text-white font-bold text-sm">2-minute window</p>
                  <p className="text-gray-400 text-xs">Your code expires 2 minutes after you tap confirm. Show it to the cashier immediately.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-white font-bold text-sm">24-hour cooldown</p>
                  <p className="text-gray-400 text-xs">After redeeming, you must wait 24 hours before using this deal again.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-white font-bold text-sm">Single use code</p>
                  <p className="text-gray-400 text-xs">Each code works once. A new 15-minute cooldown starts immediately.</p>
                </div>
              </div>
            </div>

            {/* Are you sure text */}
            <p className="text-white text-center font-bold mb-4">
              Are you at {selectedDeal.business_name} right now?
            </p>

            {/* Buttons */}
            <button
              onClick={() => {
                router.push(
                  `/member/redeem?id=${selectedDeal.id}&biz=${encodeURIComponent(selectedDeal.business_name)}&deal=${encodeURIComponent(selectedDeal.deal_description)}`
                )
                setSelectedDeal(null)
              }}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black py-4 rounded-xl text-lg mb-3 transition-all active:scale-95"
            >
              ✓ Yes — Show My Code
            </button>
            <button
              onClick={() => setSelectedDeal(null)}
              className="w-full bg-transparent text-gray-500 font-bold py-3 rounded-xl text-base hover:text-gray-300 transition-all"
            >
              Not yet — Go Back
            </button>
          </div>
        </div>
      )}

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
            {filtered.map(deal => {
              const onCooldown = cooldowns[deal.id] !== undefined
              return (
                <div
                  key={deal.id}
                  className={`bg-gray-900 rounded-2xl p-4 flex items-center gap-4 border transition-all ${
                    onCooldown ? 'border-gray-800 opacity-60' : 'border-gray-800 hover:border-amber-400'
                  }`}
                >
                  <div className="text-4xl w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    {deal.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[deal.category] || 'bg-gray-800 text-gray-300'}`}>
                        {deal.category}
                      </span>
                      {onCooldown && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
                          ⏳ {formatCooldown(cooldowns[deal.id])}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-bold truncate">{deal.business_name}</p>
                    <p className="text-amber-400 text-sm font-medium">{deal.deal_description}</p>
                    <p className="text-gray-600 text-xs mt-0.5">📍 {deal.address}</p>
                  </div>
                  <button
                    onClick={() => !onCooldown && setSelectedDeal(deal)}
                    disabled={onCooldown}
                    className={`font-bold px-4 py-2 rounded-xl text-sm flex-shrink-0 transition-all ${
                      onCooldown
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-amber-400 hover:bg-amber-300 text-black active:scale-95'
                    }`}
                  >
                    {onCooldown ? 'Used' : 'Redeem'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}