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
}

type Deal = {
  id: string
  business_name: string
  deal_description: string
  category: string
  address: string
  active: boolean
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
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'deals' | 'submit'>('overview')

  const [newDealOffer, setNewDealOffer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  async function handleLogin() {
    if (!email) { setError('Enter your email'); return }
    if (!accessCode) { setError('Enter your access code'); return }
    setLoading(true)
    setError('')

    const { data, error: sbError } = await supabase
      .from('business_accounts')
      .select('*')
      .eq('contact_email', email.toLowerCase().trim())
      .eq('active', true)
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
    setAuthed(true)
    setLoading(false)
  }

  async function toggleDeal(deal: Deal) {
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
        <button onClick={() => { setAuthed(false); setAccount(null); setEmail(''); setAccessCode('') }}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: deal.active ? 'var(--green)' : 'var(--ink-4)', flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: deal.active ? 'var(--green-dk)' : 'var(--ink-4)' }}>
                          {deal.active ? 'Live' : 'Paused'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => toggleDeal(deal)}
                        disabled={togglingDeal === deal.id}
                        className={deal.active ? 'btn btn-outline' : 'btn btn-primary'}
                        style={{ fontSize: '14px', padding: '10px 20px', minWidth: '90px' }}>
                        {togglingDeal === deal.id ? '...' : deal.active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(deal)}
                        style={{ fontSize: '12px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        Delete
                      </button>
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
    </main>
  )
}
