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
  const [loading, setLoading] = useState(true)
  const [used, setUsed] = useState(false)
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
    setUsed(false)
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
    setCooldown(secondsLeft)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev === null || prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          setCooldown(null)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    async function checkCooldown() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/member/login'); return }

      const email = userData.user.email!
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('redemptions')
        .select('redeemed_at, code')
        .eq('member_email', email)
        .eq('deal_id', dealId)
        .gte('redeemed_at', fifteenMinsAgo)
        .order('redeemed_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        const lastUsed = new Date(data[0].redeemed_at).getTime()
        const secondsLeft = Math.min(Math.ceil((lastUsed + 15 * 60 * 1000 - Date.now()) / 1000), 900)
        if (secondsLeft > 0) {
          startCooldownTimer(secondsLeft)
          setLoading(false)
          return
        }
      }

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

    checkCooldown()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const pct = (timeLeft / 120) * 100
  const isUrgent = timeLeft <= 30

  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-amber-400 text-xl animate-pulse">Checking your perks...</p>
    </main>
  )

  // COOLDOWN SCREEN
  if (cooldown !== null) {
    const cdMins = Math.floor(cooldown / 60)
    const cdSecs = cooldown % 60
    const cdPct = (cooldown / (15 * 60)) * 100
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-white text-2xl font-bold mb-2">Cooldown Active</h2>
          <p className="text-gray-400 mb-6">You already used this deal recently. Come back in:</p>
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 mb-6">
            <p className="text-5xl font-black text-amber-400 tabular-nums">
              {cdMins}:{cdSecs.toString().padStart(2, '0')}
            </p>
            <p className="text-gray-500 text-sm mt-2">minutes remaining</p>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
              <div
                className="h-2 rounded-full bg-amber-400 transition-all duration-1000"
                style={{ width: `${cdPct}%` }}
              />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-6">This prevents code sharing. Each deal has a 15-minute cooldown per member.</p>
          <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-gray-300">
            ← Back to deals
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
        <p className="text-gray-400 mb-4">Your 2-minute window is up.</p>
        <p className="text-gray-600 text-sm mb-8">A new 15-minute cooldown has started to prevent sharing.</p>
        <button onClick={() => router.back()} className="w-full bg-amber-400 text-black font-bold py-4 rounded-xl text-lg mb-4">
          ← Back to deals
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
          <p className="text-gray-400 text-sm mt-1">Show this to the cashier</p>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">Redeeming at</p>
          <h2 className="text-white text-xl font-bold">{biz}</h2>
          <p className="text-amber-400 font-medium mt-1">{deal}</p>
        </div>

        <div className="bg-white rounded-3xl p-8 mb-6 text-center">
          <p className="text-gray-400 text-sm mb-3">Your one-time code</p>
          <p className="text-6xl font-black text-black tracking-widest mb-3">{code}</p>
          <p className="text-gray-400 text-xs">Valid for 2 minutes · Single use only</p>
        </div>

        <div className={`rounded-2xl p-4 mb-6 ${isUrgent ? 'bg-red-950 border border-red-500' : 'bg-gray-900 border border-gray-800'}`}>
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
          <p className="text-gray-400 text-sm">Read your code out loud or show this screen. Cashier enters it to apply your discount. 15-min cooldown after use.</p>
        </div>

        <button onClick={() => router.back()} className="w-full text-gray-600 text-sm py-2 hover:text-gray-400">
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