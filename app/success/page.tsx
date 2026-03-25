'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function SuccessContent() {
  const params = useSearchParams()
  const email = params.get('email') || ''
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function sendMagicLink() {
      if (!email) return
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/member/deals`
        }
      })
      if (!error) setSent(true)
      setLoading(false)
    }
    sendMagicLink()
  }, [email])

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">

        {/* Confetti emoji */}
        <div className="text-7xl mb-6">🎉</div>

        <h1 className="text-4xl font-black text-white mb-3">
          Welcome to<br/>
          Perk<span className="text-amber-400">Pass</span>!
        </h1>

        <p className="text-gray-400 mb-8">
          You&apos;re now a member. Philadelphia&apos;s best local deals are yours.
        </p>

        {loading ? (
          <p className="text-amber-400 animate-pulse">Setting up your account...</p>
        ) : sent ? (
          <div className="bg-green-900 border border-green-500 rounded-2xl p-6 mb-6">
            <div className="text-3xl mb-3">📬</div>
            <h2 className="text-white font-bold text-lg mb-2">Check your email!</h2>
            <p className="text-green-300 text-sm">
              We sent a magic link to <strong>{email}</strong>.
              Click it to access all your Philly deals.
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
            <p className="text-gray-400 text-sm">
              Go to the login page and sign in with <strong className="text-white">{email}</strong>
            </p>
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6 text-left">
          <p className="text-white font-bold text-sm mb-3">What happens next:</p>
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">1. Click the magic link in your email</p>
            <p className="text-gray-400 text-sm">2. Browse your Philly deals</p>
            <p className="text-gray-400 text-sm">3. Tap Redeem at any partner business</p>
            <p className="text-gray-400 text-sm">4. Show your code to the cashier</p>
          </div>
        </div>

        <a
          href="/member/login"
          className="block w-full bg-amber-400 text-black font-bold py-4 rounded-xl text-lg"
        >
          Go to My Deals →
        </a>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-amber-400 text-xl animate-pulse">Loading...</p>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}