'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function RedeemContent() {
  const params = useSearchParams()
  const router = useRouter()
  const biz = params.get('biz') || 'this business'
  const deal = params.get('deal') || 'your deal'
  const dealId = params.get('id') || ''

  const [timeLeft, setTimeLeft] = useState(120)
  const [code, setCode] = useState('')
  const [expired, setExpired] = useState(false)
  const [cooldown, setCooldown] = useState<number | null>(null)
  const [cooldownType, setCooldownType] = useState<'15min' | '24hr'>('15min')
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)

  function makeCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const numbers = '23456789'
    let c = ''
    for (let i = 0; i < 3; i++) c += letters[Math.floor(Math.random() * letters.length)]
    for (let i = 0; i < 3; i++) c += numbers[Math.floor(Math.random() * numbers.length)]
    return c
  }

  function startTimer(newCode: string) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setExpired(false)
    setTimeLeft(120)
    setCode(newCode)
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function startCooldownTimer(secondsLeft: number) {
    const capped = Math.min(secondsLeft, cooldownType === '24hr' ? 86400 : 900)
    setCooldown(capped)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev === null || prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    async function checkAndRedeem() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/member/login'); return }
      const email = userData.user.email!

      // Check 24-hour cooldown first
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: dayData } = await supabase
        .from('redemptions')
        .select('redeemed_at')
        .eq('member_email', email)
        .eq('deal_id', dealId)
        .gte('redeemed_at', oneDayAgo)
        .order('redeemed_at', { ascending: false })
        .limit(1)

      if (dayData && dayData.length > 0) {
        const lastUsed = new Date(dayData[0].redeemed_at).getTime()
        const secsLeft = Math.ceil((lastUsed + 24 * 60 * 60 * 1000 - Date.now()) / 1000)
        if (secsLeft > 0) {
          setCooldownType('24hr')
          startCooldownTimer(secsLeft)
          setLoading(false)
          return
        }
      }

      // Check 15-minute cooldown
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      const { data: minData } = await supabase
        .from('redemptions')
        .select('redeemed_at')
        .eq('member_email', email)
        .eq('deal_id', dealId)
        .gte('redeemed_at', fifteenMinsAgo)
        .order('redeemed_at', { ascending: false })
        .limit(1)

      if (minData && minData.length > 0) {
        const lastUsed = new Date(minData[0].redeemed_at).getTime()
        const secsLeft = Math.ceil((lastUsed + 15 * 60 * 1000 - Date.now()) / 1000)
        if (secsLeft > 0) {
          setCooldownType('15min')
          startCooldownTimer(secsLeft)
          setLoading(false)
          return
        }
      }

      // All clear — generate code and log redemption
      const newCode = makeCode()
      await supabase.from('redemptions').insert({
        member_email: email,
        business_name: biz,
        deal_description: deal,
        deal_id: dealId,
        code: newCode,
        redeemed_at: new Date().toISOString()
      })

      startTimer(newCode)
      setLoading(false)
    }

    checkAndRedeem()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  function formatCooldown(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const pct = (timeLeft / 120) * 100
  const isUrgent = timeLeft <= 30

  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-amber-400 text-xl animate-pulse">Getting your code...</p>
    </main>
  )

  // COOLDOWN SCREEN
  if (cooldown !== null) {
    const is24hr = cooldownType === '24hr'
    const totalSecs = is24hr ? 86400 : 900
    const cdPct = (cooldown / totalSecs) * 100

    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-4">{is24hr ? '🌙' : '⏳'}</div>
          <h2 className="text-white text-2xl font-bold mb-2">
            {is24hr ? '24-Hour Limit Reached' : 'Cooldown Active'}
          </h2>
          <p className="text-gray-400 mb-6">
            {is24hr
              ? 'You already used this deal today. Come back tomorrow!'
              : 'You used a code recently. Wait a moment before generating a new one.'}
          </p>
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 mb-6">
            <p className="text-5xl font-black text-amber-400 tabular-nums">
              {formatCooldown(cooldown)}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {is24hr ? 'hours remaining' : 'minutes remaining'}
            </p>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
              <div
                className="h-2 rounded-full bg-amber-400 transition-all duration-1000"
                style={{ width: `${cdPct}%` }}
              />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            {is24hr
              ? 'Each deal can only be used once every 24 hours to keep offers fair for all members.'
              : 'Each code has a 15-minute cooldown to prevent sharing.'}
          </p>
          <button
            onClick={() => router.push('/member/deals')}
            className="w-full bg-amber-400 text-black font-bold py-4 rounded-xl text-lg"
          >
            Browse Other Deals
          </button>
        </div>
      </main>
    )
  }

  // EXPIRED SCREEN
  if (expired) return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4">⏰</div>
        <h2 className="text-white text-2xl font-bold mb-3">Code Expired</h2>
        <p className="text-gray-400 mb-4">Your 2-minute window passed.</p>
        <p className="text-gray-600 text-sm mb-8">
          A 15-minute cooldown is now active before you can generate a new code.
        </p>
        <button
          onClick={() => router.push('/member/deals')}
          className="w-full bg-amber-400 text-black font-bold py-4 rounded-xl text-lg"
        >
          ← Back to Deals
        </button>
      </div>
    </main>
  )

  // ACTIVE CODE SCREEN
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-white">
            Perk<span className="text-amber-400">Pass</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Show this to the cashier now</p>
        </div>

        <div className="text-center mb-4">
          <p className="text-gray-400 text-sm">Redeeming at</p>
          <h2 className="text-white text-xl font-bold">{biz}</h2>
          <p className="text-amber-400 font-medium mt-1">{deal}</p>
        </div>

        {/* Big code */}
        <div className="bg-white rounded-3xl p-8 mb-6 text-center shadow-2xl">
          <p className="text-gray-400 text-sm mb-3">Your one-time code</p>
          <p className="text-6xl font-black text-black tracking-widest mb-3">{code}</p>
          <p className="text-gray-400 text-xs">Valid 2 min · Single use · 24hr cooldown after use</p>
        </div>

        {/* Timer */}
        <div className={`rounded-2xl p-4 mb-4 ${isUrgent ? 'bg-red-950 border border-red-500' : 'bg-gray-900 border border-gray-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-medium ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
              {isUrgent ? '⚠️ Expiring soon!' : '⏱️ Time remaining'}
            </p>
            <p className={`text-3xl font-black tabular-nums ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-amber-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6">
          <p className="text-white font-bold text-sm mb-1">📱 How to redeem</p>
          <p className="text-gray-400 text-sm">Read your code aloud or show this screen. Cashier enters it to apply your discount.</p>
        </div>

        <button
          onClick={() => router.push('/member/deals')}
          className="w-full text-gray-600 text-sm py-2 hover:text-gray-400"
        >
          ← Back to deals
        </button>
      </div>
    </main>
  )
}

export default function RedeemPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-amber-400 text-xl animate-pulse">Loading...</p>
      </main>
    }>
      <RedeemContent />
    </Suspense>
  )
}