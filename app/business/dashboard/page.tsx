'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type BusinessAccount = {
  id: string
  business_name: string
  category: string
  address: string
  deal_offer: string
  contact_email: string
  active: boolean
  access_code: string | null
  admin_disabled: boolean
}

type Schedule = {
  days: number[]      // 0=Sun,1=Mon,...6=Sat
  start: string       // "09:00"
  end: string         // "21:00"
}

type Deal = {
  id: string
  business_name: string
  deal_description: string
  category: string
  address: string
  active: boolean
  schedule: Schedule | null
  admin_disabled: boolean
}

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
  const [accessCode, setAccessCode] = useState('')
  const [authed, setAuthed] = useState(false)
  const [settingCode, setSettingCode] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [confirmCode, setConfirmCode] = useState('')

  const [account, setAccount] = useState<BusinessAccount | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, thisMonth: 0, lastMonth: 0, byDay: {} })

  const [loading, setLoading] = useState(false)
  const [togglingDeal, setTogglingDeal] = useState<string | null>(null)
  const [deletingDeal, setDeletingDeal] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Deal | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Deal | null>(null)
  const [schedDays, setSchedDays] = useState<number[]>([0,1,2,3,4,5,6])
  const [schedStart, setSchedStart] = useState('09:00')
  const [schedEnd, setSchedEnd] = useState('21:00')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'deals' | 'submit'>('overview')

  const [newDealOffer, setNewDealOffer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('biz_session')
    if (saved) {
      try {
        const biz = JSON.parse(saved) as BusinessAccount
        loadDashboard(biz)
      } catch { localStorage.removeItem('biz_session') }
    }
  }, [])

  async function handleLogin() {
    if (!email) { setError('Enter your email'); return }
    if (!accessCode) { setError('Enter your access code'); return }
    setLoading(true)
    setError('')

    const { data, error: sbError } = await supabase
      .from('business_accounts')
      .select('*')
      .eq('contact_email', email.toLowerCase().trim())
      .limit(1)

    if (sbError || !data || data.length === 0) {
      setError('No active business account found for this email.')
      setLoading(false)
      return
    }

    const biz = data[0] as BusinessAccount

    if (!biz.access_code) {
      setAccount(biz)
      setSettingCode(true)
      setLoading(false)
      return
    }

    if (biz.access_code !== accessCode) {
      setError('Incorrect access code.')
      setLoading(false)
      return
    }

    await loadDashboard(biz)
  }

  async function handleSetCode() {
    if (!newCode || newCode.length < 4) { setError('Code must be at least 4 characters'); return }
    if (newCode !== confirmCode) { setError('Codes do not match'); return }
    setLoading(true)
    setError('')

    await supabase
      .from('business_accounts')
      .update({ access_code: newCode })
      .eq('id', account!.id)

    const updated = { ...account!, access_code: newCode }
    setAccount(updated)
    setSettingCode(false)
    await loadDashboard(updated)
  }

  async function loadDashboard(biz: BusinessAccount) {
    setLoading(true)

    const { data: dealsData } = await supabase
      .from('deals')
      .select('*')
      .eq('business_name', biz.business_name)
      .order('created_at', { ascending: false })

    const { data: redemptionData } = await supabase
      .from('redemptions')
      .select('*')
      .eq('business_name', biz.business_name)
      .order('redeemed_at', { ascending: false })

    const r = redemptionData || []
    setDeals(dealsData || [])
    setRedemptions(r)
    setAccount(biz)

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
    localStorage.setItem('biz_session', JSON.stringify(biz))
    setAuthed(true)
    setLoading(false)
  }

  async function toggleDeal(deal: Deal) {
    if (deal.admin_disabled) return
    setTogglingDeal(deal.id)
    await supabase.from('deals').update({ active: !deal.active }).eq('id', deal.id)
    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, active: !d.active } : d))
    setTogglingDeal(null)
  }

  async function deleteDeal(deal: Deal) {
    setDeletingDeal(deal.id)
    await supabase.from('deals').delete().eq('id', deal.id)
    setDeals(prev => prev.filter(d => d.id !== deal.id))
    setConfirmDelete(null)
    setDeletingDeal(null)
  }

  function openScheduleEditor(deal: Deal) {
    setEditingSchedule(deal)
    if (deal.schedule) {
      setSchedDays(deal.schedule.days)
      setSchedStart(deal.schedule.start)
      setSchedEnd(deal.schedule.end)
    } else {
      setSchedDays([0,1,2,3,4,5,6])
      setSchedStart('09:00')
      setSchedEnd('21:00')
    }
  }

  async function saveSchedule() {
    if (!editingSchedule) return
    setSavingSchedule(true)
    const schedule: Schedule = { days: schedDays, start: schedStart, end: schedEnd }
    await supabase.from('deals').update({ schedule }).eq('id', editingSchedule.id)
    setDeals(prev => prev.map(d => d.id === editingSchedule.id ? { ...d, schedule } : d))
    setEditingSchedule(null)
    setSavingSchedule(false)
  }

  async function clearSchedule() {
    if (!editingSchedule) return
    setSavingSchedule(true)
    await supabase.from('deals').update({ schedule: null }).eq('id', editingSchedule.id)
    setDeals(prev => prev.map(d => d.id === editingSchedule.id ? { ...d, schedule: null } : d))
    setEditingSchedule(null)
    setSavingSchedule(false)
  }

  async function submitNewDeal() {
    if (!newDealOffer.trim()) { setError('Enter a deal description'); return }
    setSubmitting(true)
    setError('')

    await supabase.from('business_applications').insert({
      business_name: account!.business_name,
      category: account!.category,
      address: account!.address,
      deal_offer: newDealOffer.trim(),
      contact_name: '',
      contact_email: account!.contact_email,
      phone: '',
      status: 'pending',
    })

    setNewDealOffer('')
    setSubmitSuccess(true)
    setSubmitting(false)
    setTimeout(() => setSubmitSuccess(false), 5000)
  }

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const monthChange = stats.lastMonth > 0
    ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
    : stats.thisMonth > 0 ? 100 : 0

  if (settingCode) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>Business portal</span>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 className="display fade-up" style={{ fontSize: 'clamp(40px, 10vw, 56px)', marginBottom: '8px' }}>Create your code.</h1>
          <p className="fade-up-2" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>
            First time here — set a private access code to secure your dashboard going forward.
          </p>
          <div className="fade-up-3">
            {[
              { label: 'Access code', val: newCode, set: setNewCode, placeholder: 'Min. 4 characters' },
              { label: 'Confirm code', val: confirmCode, set: setConfirmCode, placeholder: 'Repeat your code' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>{f.label}</label>
                <input type="password" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="pp-input" />
              </div>
            ))}
            {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '10px' }}>{error}</p>}
            <button onClick={handleSetCode} disabled={loading} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px', marginTop: '8px' }}>
              {loading ? 'Saving...' : 'Set code & enter dashboard'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )

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
            Enter your email and access code.
          </p>
          <div className="fade-up-3">
            {[
              { label: 'Email address', val: email, set: setEmail, type: 'email', placeholder: 'you@yourbusiness.com' },
              { label: 'Access code', val: accessCode, set: setAccessCode, type: 'password', placeholder: 'Your private access code' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="pp-input"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
            ))}
            <p style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500, marginBottom: '16px' }}>
              First time logging in? Enter your email and any code — you will be prompted to set your access code.
            </p>
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
        <Link href="/business/dashboard" className="pp-logo">Perk<span>Pass</span></Link>
        <button onClick={() => { localStorage.removeItem('biz_session'); setAuthed(false); setAccount(null); setEmail(''); setAccessCode('') }}
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </header>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 className="display" style={{ fontSize: 'clamp(36px, 8vw, 52px)', marginBottom: '4px' }}>{account?.business_name}</h1>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PerkPass partner dashboard</p>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '2px solid var(--ink)' }}>
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'deals', label: `My Deals (${deals.length})` },
            { key: 'submit', label: 'Submit Deal' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '15px', textTransform: 'uppercase',
              letterSpacing: '0.04em', padding: '10px 16px', border: 'none', cursor: 'pointer', background: 'none',
              color: tab === t.key ? 'var(--ink)' : 'var(--ink-4)',
              borderBottom: tab === t.key ? '2px solid var(--ink)' : '2px solid transparent',
              marginBottom: '-2px',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '32px' }}>
              <div style={{ background: 'var(--forest)', borderRadius: '10px', padding: '24px', border: '1px solid var(--green-lt)' }}>
                <div className="display" style={{ fontSize: '52px', color: '#ffffff', lineHeight: 1, marginBottom: '4px' }}>{stats.total}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)' }}>Total customers</div>
              </div>
              <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '24px', border: '1px solid var(--border-2)' }}>
                <div className="display" style={{ fontSize: '52px', color: 'var(--ink)', lineHeight: 1, marginBottom: '4px' }}>{stats.thisMonth}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>
                  This month{monthChange !== 0 && <span style={{ marginLeft: '6px', color: monthChange > 0 ? 'var(--green-dk)' : 'var(--red)' }}>{monthChange > 0 ? '+' : ''}{monthChange}%</span>}
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

            {Object.keys(stats.byDay).length > 0 && (
              <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '20px', marginBottom: '32px', border: '1px solid var(--border-2)' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '16px' }}>Visits by day</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '60px' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                    const count = stats.byDay[day] || 0
                    const max = Math.max(...Object.values(stats.byDay), 1)
                    const pct = (count / max) * 100
                    return (
                      <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '100%', background: count > 0 ? 'var(--green)' : 'var(--bg-3)', borderRadius: '3px', height: `${Math.max(pct, 4)}%` }} />
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)' }}>{day}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <h2 className="display" style={{ fontSize: '32px', marginBottom: '16px' }}>Recent visits</h2>
            {redemptions.length === 0 ? (
              <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '32px', textAlign: 'center', border: '1px solid var(--border-2)' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-3)' }}>No redemptions yet.</p>
                <p style={{ fontSize: '14px', color: 'var(--ink-4)', marginTop: '4px' }}>When members redeem deals at your business they will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {redemptions.slice(0, 20).map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 800, color: 'var(--ink)', marginBottom: '2px' }}>{r.deal_description}</div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500 }}>Code: {r.code}</div>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, color: 'var(--ink-3)', flexShrink: 0 }}>{formatDate(r.redeemed_at)}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '40px', background: 'var(--bg-2)', borderRadius: '10px', padding: '20px', border: '1px solid var(--border-2)' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: '8px' }}>Verify member codes</div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '16px' }}>When a member wants to redeem a deal, use the scanner to verify their code.</p>
              <Link href="/business/scan" className="btn btn-primary" style={{ fontSize: '15px', padding: '12px 24px', display: 'inline-flex' }}>Open code scanner</Link>
            </div>
          </div>
        )}

        {tab === 'deals' && (
          <div>
            <h2 className="display" style={{ fontSize: '36px', marginBottom: '8px' }}>Your deals</h2>
            {account?.admin_disabled ? (
              <div style={{ background: 'var(--red-lt)', borderRadius: '10px', padding: '28px', textAlign: 'center', border: '1px solid var(--red)', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--red-lt)', border: '2px solid var(--red)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <div className="display" style={{ fontSize: '24px', color: 'var(--red)', marginBottom: '8px' }}>Account suspended.</div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--red)', lineHeight: 1.5 }}>
                  Your account has been disabled by PerkPass. Your deals are no longer visible to members and cannot be managed until your account is reinstated.
                </p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginTop: '12px' }}>
                  Please contact PerkPass to resolve this.
                </p>
                <a href="tel:6105337791" style={{ display: 'inline-block', marginTop: '12px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--red)', textDecoration: 'none', border: '2px solid var(--red)', borderRadius: '8px', padding: '10px 24px' }}>
                  Call (610) 533-7791
                </a>
              </div>
            ) : (
            <>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '24px' }}>Toggle deals on or off. Members only see active deals.</p>
            {deals.length === 0 ? (
              <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '32px', textAlign: 'center', border: '1px solid var(--border-2)' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-3)' }}>No deals yet.</p>
                <p style={{ fontSize: '14px', color: 'var(--ink-4)', marginTop: '4px', marginBottom: '20px' }}>Once your application is approved, your deal will appear here.</p>
                <button onClick={() => setTab('submit')} className="btn btn-primary" style={{ fontSize: '15px', padding: '12px 24px' }}>Submit a deal</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {deals.map(deal => (
                  <div key={deal.id} style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '20px', border: `1px solid ${deal.active ? 'var(--green)' : 'var(--border-2)'}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--ink)', marginBottom: '4px' }}>{deal.deal_description}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: deal.admin_disabled ? 'var(--red)' : deal.active ? 'var(--green)' : 'var(--ink-4)', flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: deal.admin_disabled ? 'var(--red)' : deal.active ? 'var(--green-dk)' : 'var(--ink-4)' }}>
                          {deal.admin_disabled ? 'Disabled by admin' : deal.active ? 'Live' : 'Paused'}
                        </span>
                      </div>
                      {deal.schedule ? (
                        <div style={{ fontSize: '11px', color: 'var(--ink-4)', fontWeight: 500 }}>
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_,i) => deal.schedule!.days.includes(i)).join(', ')} · {deal.schedule.start}–{deal.schedule.end}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--ink-4)', fontWeight: 500 }}>Always available</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                      {deal.admin_disabled ? (
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--red)', textAlign: 'center', padding: '4px 8px' }}>
                          Contact PerkPass
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleDeal(deal)}
                            disabled={togglingDeal === deal.id}
                            className={deal.active ? 'btn btn-outline' : 'btn btn-primary'}
                            style={{ fontSize: '14px', padding: '10px 20px', minWidth: '90px' }}>
                            {togglingDeal === deal.id ? '...' : deal.active ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => openScheduleEditor(deal)}
                            style={{ fontSize: '12px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--green-dk)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            {deal.schedule ? 'Edit hours' : 'Set hours'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(deal)}
                            style={{ fontSize: '12px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button onClick={() => setTab('submit')} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--green-dk)', background: 'none', border: 'none', cursor: 'pointer' }}>
                + Submit a new deal
              </button>
            </div>
            </>
            )}
          </div>
        )}

        {tab === 'submit' && (
          <div>
            <h2 className="display" style={{ fontSize: '36px', marginBottom: '8px' }}>Submit a deal.</h2>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '28px' }}>
              Propose a new deal for PerkPass members. We will review and activate it within 1-2 business days.
            </p>

            {submitSuccess ? (
              <div style={{ background: 'var(--green-lt)', borderRadius: '10px', padding: '28px', textAlign: 'center', border: '1px solid var(--green)' }}>
                <div className="display" style={{ fontSize: '40px', color: 'var(--green-dk)', marginBottom: '8px' }}>Submitted.</div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--green-dk)' }}>Your deal proposal is under review. We will be in touch soon.</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                    Deal offer
                  </label>
                  <input
                    type="text"
                    value={newDealOffer}
                    onChange={e => setNewDealOffer(e.target.value)}
                    placeholder="e.g. 20% off any service, Free coffee with any purchase"
                    className="pp-input"
                    onKeyDown={e => e.key === 'Enter' && submitNewDeal()}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500, marginTop: '6px' }}>
                    Keep it short and clear. Members will see exactly this text.
                  </p>
                </div>

                <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '16px', marginBottom: '20px', border: '1px solid var(--border-2)' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '8px' }}>Submitting for</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px', fontWeight: 800, color: 'var(--ink)' }}>{account?.business_name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>{account?.category} · {account?.address}</div>
                </div>

                {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '12px' }}>{error}</p>}
                <button onClick={submitNewDeal} disabled={submitting || !newDealOffer.trim()} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px' }}>
                  {submitting ? 'Submitting...' : 'Submit for review'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule editor modal */}
      {editingSchedule && (() => {
        const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
        const TIMES: string[] = []
        for (let h = 0; h < 24; h++) {
          TIMES.push(`${String(h).padStart(2,'0')}:00`)
          TIMES.push(`${String(h).padStart(2,'0')}:30`)
        }
        function fmt(t: string) {
          const [hh, mm] = t.split(':').map(Number)
          const ampm = hh >= 12 ? 'PM' : 'AM'
          return `${hh % 12 || 12}:${String(mm).padStart(2,'0')} ${ampm}`
        }
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '28px 24px', width: '100%', maxWidth: '420px', border: '2px solid var(--ink)' }}>
              <h2 className="display" style={{ fontSize: '28px', marginBottom: '4px' }}>Set availability</h2>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '24px' }}>{editingSchedule.deal_description}</p>

              {/* Day toggles */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>Active days</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {DAY_LABELS.map((d, i) => (
                    <button key={i} onClick={() => setSchedDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort())}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700,
                        background: schedDays.includes(i) ? 'var(--forest)' : 'var(--bg-2)',
                        color: schedDays.includes(i) ? 'var(--green)' : 'var(--ink-4)',
                        outline: schedDays.includes(i) ? '2px solid var(--green)' : '1px solid var(--border)',
                      }}>
                      {d.slice(0,1)}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button onClick={() => setSchedDays([1,2,3,4,5])} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-2)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', cursor: 'pointer' }}>Weekdays</button>
                  <button onClick={() => setSchedDays([0,6])} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-2)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', cursor: 'pointer' }}>Weekends</button>
                  <button onClick={() => setSchedDays([0,1,2,3,4,5,6])} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-2)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', cursor: 'pointer' }}>Every day</button>
                </div>
              </div>

              {/* Time range */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>Hours</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select value={schedStart} onChange={e => setSchedStart(e.target.value)} className="pp-input" style={{ flex: 1, padding: '10px 12px', fontSize: '15px', fontWeight: 600 }}>
                    {TIMES.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
                  </select>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: 'var(--ink-4)' }}>to</span>
                  <select value={schedEnd} onChange={e => setSchedEnd(e.target.value)} className="pp-input" style={{ flex: 1, padding: '10px 12px', fontSize: '15px', fontWeight: 600 }}>
                    {TIMES.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '4px' }}>Members will see</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  {schedDays.length === 0 ? 'No days selected' : schedDays.length === 7 ? `Every day, ${fmt(schedStart)}–${fmt(schedEnd)}` : `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_,i) => schedDays.includes(i)).join(', ')}, ${fmt(schedStart)}–${fmt(schedEnd)}`}
                </div>
              </div>

              <button onClick={saveSchedule} disabled={savingSchedule || schedDays.length === 0} className="btn btn-primary" style={{ width: '100%', fontSize: '16px', padding: '14px', marginBottom: '8px' }}>
                {savingSchedule ? 'Saving...' : 'Save schedule'}
              </button>
              {editingSchedule.schedule && (
                <button onClick={clearSchedule} disabled={savingSchedule} style={{ width: '100%', marginBottom: '8px', padding: '12px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', cursor: 'pointer' }}>
                  Remove schedule (always available)
                </button>
              )}
              <button onClick={() => setEditingSchedule(null)} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )
      })()}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '28px 24px', width: '100%', maxWidth: '380px', border: '2px solid var(--ink)', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--red-lt)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h2 className="display" style={{ fontSize: '28px', marginBottom: '8px' }}>Delete this deal?</h2>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-dk)', marginBottom: '8px' }}>{confirmDelete.deal_description}</p>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: '8px' }}>
              This action cannot be undone. The deal will be permanently removed and members won't see it anymore.
            </p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-4)', marginBottom: '24px' }}>
              To offer a new deal, use the Submit Deal tab.
            </p>
            <button
              onClick={() => deleteDeal(confirmDelete)}
              disabled={deletingDeal === confirmDelete.id}
              style={{ width: '100%', marginBottom: '10px', padding: '14px', background: 'var(--red-lt)', border: '1px solid var(--red)', borderRadius: '8px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--red)', cursor: 'pointer' }}>
              {deletingDeal === confirmDelete.id ? 'Deleting...' : 'Yes, delete permanently'}
            </button>
            <button onClick={() => setConfirmDelete(null)} className="btn btn-primary" style={{ width: '100%', fontSize: '16px', padding: '14px' }}>
              Keep this deal
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
