'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Redemption = {
  id: string
  member_email: string
  deal_description: string
  code: string
  redeemed_at: string
}

type Stats = {
  total: number
  thisMonth: number
  lastMonth: number
  byDay: Record<string, number>
}

export default function BusinessDashboard() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, thisMonth: 0, lastMonth: 0, byDay: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email) { setError('Enter your email'); return }
    setLoading(true)
    setError('')

    const { data, error: sbError } = await supabase
      .from('business_accounts')
      .select('*')
      .eq('contact_email', email.toLowerCase())
      .eq('active', true)
      .limit(1)

    if (sbError || !data || data.length === 0) {
      setError('No active business account found for this email.')
      setLoading(false)
      return
    }

    const biz = data[0]
    setBusinessName(biz.business_name)

    const { data: redemptionData } = await supabase
      .from('redemptions')
      .select('*')
      .eq('business_name', biz.business_name)
      .order('redeemed_at', { ascending: false })

    const r = redemptionData || []
    setRedemptions(r)

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

    const thisMonth = r.filter(x => x.redeemed_at >= thisMonthStart).length
    const lastMonth = r.filter(x => x.redeemed_at >= lastMonthStart && x.redeemed_at < thisMonthStart).length

    const byDay: Record<string, number> = {}
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    r.forEach(x => {
      const d = days[new Date(x.redeemed_at).getDay()]
      byDay[d] = (byDay[d] || 0) + 1
    })

    setStats({ total: r.length, thisMonth, lastMonth, byDay })
    setAuthed(true)
    setLoading(false)
  }

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const monthChange = stats.lastMonth > 0
    ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
    : stats.thisMonth > 0 ? 100 : 0

  if (!authed) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>Business portal</span>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 className="display fade-up" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '8px' }}>Business login.</h1>
          <p className="fade-up-2" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>
            Enter the email you used to apply.
          </p>
          <div className="fade-up-3">
            <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourbusiness.com" className="pp-input" style={{ marginBottom: '12px' }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '12px' }}>{error}</p>}
            <button onClick={handleLogin} disabled={loading || !email} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px', marginBottom: '16px' }}>
              {loading ? 'Loading...' : 'View my dashboard'}
            </button>
            <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500, marginBottom: '8px' }}>Not listed yet?</p>
              <Link href="/for-business" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--green-dk)', textDecoration: 'none' }}>
                Apply to join PerkPass
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '2px solid var(--ink)', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <button onClick={() => setAuthed(false)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </header>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '32px' }}>
          <h1 className="display" style={{ fontSize: 'clamp(36px, 8vw, 52px)', marginBottom: '4px' }}>{businessName}</h1>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PerkPass partner dashboard</p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--forest)', borderRadius: '10px', padding: '24px', border: '1px solid var(--green-lt)' }}>
            <div className="display" style={{ fontSize: '52px', color: '#ffffff', lineHeight: 1, marginBottom: '4px' }}>{stats.total}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)' }}>Total customers</div>
          </div>
          <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '24px', border: '1px solid var(--border-2)' }}>
            <div className="display" style={{ fontSize: '52px', color: 'var(--ink)', lineHeight: 1, marginBottom: '4px' }}>{stats.thisMonth}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>
              This month
              {monthChange !== 0 && (
                <span style={{ marginLeft: '8px', color: monthChange > 0 ? 'var(--green-dk)' : 'var(--red)' }}>
                  {monthChange > 0 ? '+' : ''}{monthChange}%
                </span>
              )}
            </div>
          </div>
          <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '24px', border: '1px solid var(--border-2)' }}>
            <div className="display" style={{ fontSize: '52px', color: 'var(--ink)', lineHeight: 1, marginBottom: '4px' }}>{stats.lastMonth}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>Last month</div>
          </div>
          <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '24px', border: '1px solid var(--border-2)' }}>
            <div className="display" style={{ fontSize: '52px', color: 'var(--ink)', lineHeight: 1, marginBottom: '4px' }}>
              {Object.entries(stats.byDay).sort((a, b) => b[1] - a[1])[0]?.[0] || '--'}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>Busiest day</div>
          </div>
        </div>

        {/* Day breakdown */}
        {Object.keys(stats.byDay).length > 0 && (
          <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '20px', marginBottom: '32px', border: '1px solid var(--border-2)' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '16px' }}>
              Visits by day
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '60px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const count = stats.byDay[day] || 0
                const max = Math.max(...Object.values(stats.byDay), 1)
                const pct = (count / max) * 100
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', background: count > 0 ? 'var(--green)' : 'var(--bg-3)', borderRadius: '3px', height: `${Math.max(pct, 4)}%`, transition: 'height 0.3s' }} />
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)' }}>{day}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent redemptions */}
        <div>
          <h2 className="display" style={{ fontSize: '32px', marginBottom: '16px' }}>Recent visits</h2>
          {redemptions.length === 0 ? (
            <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '32px', textAlign: 'center', border: '1px solid var(--border-2)' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-3)' }}>No redemptions yet.</p>
              <p style={{ fontSize: '14px', color: 'var(--ink-4)', marginTop: '4px' }}>When members redeem deals at your business they'll appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {redemptions.slice(0, 20).map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 800, color: 'var(--ink)', marginBottom: '2px' }}>
                      {r.deal_description}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500 }}>
                      Code: {r.code}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--ink-3)', flexShrink: 0 }}>
                    {formatDate(r.redeemed_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scan link */}
        <div style={{ marginTop: '40px', background: 'var(--bg-2)', borderRadius: '10px', padding: '20px', border: '1px solid var(--border-2)' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: '8px' }}>
            Verify member codes
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '16px' }}>
            When a member wants to redeem a deal, use the scanner to verify their code.
          </p>
          <Link href="/business/scan" className="btn btn-primary" style={{ fontSize: '15px', padding: '12px 24px', display: 'inline-flex' }}>
            Open code scanner
          </Link>
        </div>
      </div>
    </main>
  )
}