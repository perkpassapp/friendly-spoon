'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const email = params.get('email') || ''
  const [status, setStatus] = useState<'loading' | 'sending' | 'done' | 'error'>('loading')

  useEffect(() => {
    async function autoLogin() {
      if (!email) { router.push('/'); return }

      setStatus('sending')

      // Check if already logged in
      const { data: existing } = await supabase.auth.getUser()
      if (existing.user) {
        router.push('/member/deals')
        return
      }

      // Send magic link — they click it and land straight on deals
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/member/deals`,
          shouldCreateUser: true,
        }
      })

      if (error) {
        setStatus('error')
      } else {
        setStatus('done')
      }
    }

    autoLogin()
  }, [email, router])

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">

        {status === 'loading' && (
          <>
            <div className="text-6xl mb-6 animate-pulse">⚡</div>
            <h2 className="text-white text-2xl font-bold">Setting up your account...</h2>
          </>
        )}

        {status === 'sending' && (
          <>
            <div className="text-6xl mb-6 animate-pulse">⚡</div>
            <h2 className="text-white text-2xl font-bold">Almost there...</h2>
          </>
        )}

        {status === 'done' && (
          <>
            {/* Big celebration */}
            <div className="text-7xl mb-6">🎉</div>
            <h1 className="text-4xl font-black text-white mb-3">
              Welcome to<br/>
              Perk<span className="text-amber-400">Pass</span>!
            </h1>
            <p className="text-gray-400 mb-8">
              Payment confirmed. You&apos;re officially a member.
            </p>

            {/* Email instruction */}
            <div className="bg-amber-400 rounded-2xl p-6 mb-6 text-left">
              <div className="text-3xl mb-3">📬</div>
              <h2 className="text-black font-black text-lg mb-2">
                One tap to get in
              </h2>
              <p className="text-black text-sm font-medium">
                We just sent a magic link to{' '}
                <strong>{email}</strong>.
                {' '}Open your email and tap the link — you&apos;ll land straight on your deals. No password ever.
              </p>
            </div>

            {/* What they get */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-6 text-left">
              <p className="text-white font-bold text-sm mb-3">🎟️ Your membership includes:</p>
              <div className="space-y-2">
                {[
                  'Restaurants & cafes across Philly',
                  'Barbers, nail salons & fitness',
                  '2-minute QR redemption codes',
                  'New deals added every week',
                ].map(item => (
                  <p key={item} className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="text-amber-400">✓</span> {item}
                  </p>
                ))}
              </div>
            </div>

            {/* CTA */}
            <a
              href="/member/login"
              className="block w-full bg-amber-400 hover:bg-amber-300 text-black font-black py-4 rounded-xl text-lg transition-all active:scale-95 mb-3"
            >
              Go to My Deals →
            </a>
            <p className="text-gray-600 text-xs">
              Can&apos;t find the email? Check your spam folder or{' '}
              <a href="/member/login" className="text-amber-400 underline">
                request a new link
              </a>
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-white text-2xl font-bold mb-3">Payment successful!</h2>
            <p className="text-gray-400 mb-6">
              Your payment went through but we had trouble sending your login link.
              Use the button below to log in manually.
            </p>
            <a
              href="/member/login"
              className="block w-full bg-amber-400 text-black font-black py-4 rounded-xl text-lg mb-3"
            >
              Log In to My Account →
            </a>
          </>
        )}

      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-amber-400 text-xl animate-pulse">Setting up your account...</p>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}