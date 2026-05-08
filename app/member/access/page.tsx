'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type MemberStatus = {
  exists: boolean
  active: boolean
}

export default function MemberAccessPage() {
  const router = useRouter()

  useEffect(() => {
    async function routeMember() {
      const { data } = await supabase.auth.getUser()
      const user = data.user

      if (!user?.email) {
        router.replace('/member/login')
        return
      }

      try {
        const res = await fetch(`/api/member-status?email=${encodeURIComponent(user.email)}`)
        if (!res.ok) {
          router.replace('/signup')
          return
        }

        const status = (await res.json()) as MemberStatus

        if (status.active) {
          router.replace('/member/deals')
          return
        }

        router.replace('/signup')
      } catch {
        router.replace('/signup')
      }
    }

    routeMember()
  }, [router])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)' }}>
        Checking your account...
      </div>
    </main>
  )
}
