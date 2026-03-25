'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function RedeemContent() {
  const params = useSearchParams()
  const router = useRouter()
  const biz = params.get('biz') || 'this business'
  const deal = params.get('deal') || 'your deal'

  const [timeLeft, setTimeLeft] = useState(120)
  const [code, setCode] = useState('')
  const [expired, setExpired] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  function makeCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const numbers = '23456789'
    let c = ''
    for (let i = 0; i < 3; i++) c += letters[Math.floor(Math.random() * letters.length)]
    for (let i = 0; i < 3; i++) c += numbers[Math.floor(Math.random() * numbers.length)]
    return c
  }

  function startTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const newCode = makeCode()
    setCode(newCode)
    setExpired(false)
    setTimeLeft(120)

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

  useEffect(() => {
    startTimer()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const pct = (timeLeft / 120) * 100
  const isUrgent = timeLeft <= 30

  if (expired) return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4">⏰</div>
        <h2 className="text-white text-2xl font-bold mb-3">Code Expired</h2>
        <p className="text-gray-400 mb-8">Your 2-minute window is up. Generate a new code.</p>
        <button
          onClick={startTimer}
          className="w-full bg-amber-400 text-black font-bold py-4 rounded-xl text-lg mb-4 active:scale-95 transition-all"
        >
          🔄 Generate New Code
        </button>
        <button onClick={() => router.back()} className="text-gray-600 text-sm">← Back to deals</button>
      </div>
    </main>
  )

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
          <p className="text-gray-400 text-sm mb-3">Your code</p>
          <p className="text-6xl font-black text-black tracking-widest mb-3">{code}</p>
          <p className="text-gray-400 text-xs">Show this to the cashier</p>
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
          <p className="text-gray-400 text-sm">Read your code out loud or show this screen. The cashier enters it to apply your discount.</p>
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