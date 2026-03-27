'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Application = {
  id: string
  business_name: string
  category: string
  address: string
  deal_offer: string
  contact_name: string
  contact_email: string
  phone: string
  status: string
  created_at: string
}

type Deal = {
  id: string
  business_name: string
  deal_description: string
  category: string
  address: string
  active: boolean
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'applications' | 'deals'>('overview')
  const [applications, setApplications] = useState<Application[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [stats, setStats] = useState({ members: 0, redemptions: 0, deals: 0 })
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const [appsRes, dealsRes, redemptionsRes] = await Promise.all([
      supabase.from('business_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('deals').select('*').order('created_at', { ascending: false }),
      supabase.from('redemptions').select('id'),
    ])
    setApplications(appsRes.data || [])
    setDeals(dealsRes.data || [])
    setStats({
      members: 0,
      redemptions: redemptionsRes.data?.length || 0,
      deals: dealsRes.data?.filter(d => d.active).length || 0,
    })
    setLoading(false)
  }

  async function approveApplication(app: Application) {
    setApproving(app.id)
    await supabase.from('deals').insert({
      business_name: app.business_name,
      deal_description: app.deal_offer,
      category: app.category,
      address: app.address,
      emoji: '🎟️',
      active: true,
    })
    await supabase.from('business_accounts').insert({
      business_name: app.business_name,
      category: app.category,
      address: app.address,
      deal_offer: app.deal_offer,
      contact_email: app.contact_email,
      active: true,
    })
    await supabase.from('business_applications').update({ status: 'approved' }).eq('id', app.id)
    await loadData()
    setApproving(null)
  }

  async function rejectApplication(id: string) {
    await supabase.from('business_applications').update({ status: 'rejected' }).eq('id', id)
    await loadData()
  }

  async function toggleDeal(id: string, active: boolean) {
    await supabase.from('deals').update({ active: !active }).eq('id', id)
    await loadData()
  }

  function login() {
    if (password === 'perkpassadmin') { setAuthed(true); loadData() }
    else setError('Wrong password')
  }

  const pending = applications.filter(a => a.status === 'pending')

  if (!authed) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h1 className="display fade-up" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '8px' }}>Admin.</h1>
          <p className="fade-up-2" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>Your command center.</p>
          <div className="fade-up-3">
            <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" className="pp-input" style={{ marginBottom: '10px' }} onKeyDown={e => e.key === 'Enter' && login()} />
            {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '10px' }}>{error}</p>}
            <button onClick={login} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '15px' }}>Enter</button>
          </div>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '2px solid var(--ink)', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>Admin</span>
        </div>
        <button onClick={() => setAuthed(false)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </header>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '2px solid var(--ink)', paddingBottom: '0' }}>
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'applications', label: `Applications${pending.length > 0 ? ` (${pending.length})` : ''}` },
            { key: 'deals', label: 'Live Deals' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.04em',
              padding: '12px 20px', border: 'none', cursor: 'pointer',
              background: 'none',
              color: tab === t.key ? 'var(--ink)' : 'var(--ink-4)',
              borderBottom: tab === t.key ? '2px solid var(--ink)' : '2px solid transparent',
              marginBottom: '-2px',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            <h2 className="display" style={{ fontSize: '40px', marginBottom: '20px' }}>Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '32px' }}>
              {[
                { label: 'Active deals', value: stats.deals },
                { label: 'Total redemptions', value: stats.redemptions },
                { label: 'Pending applications', value: pending.length },
                { label: 'Total businesses', value: deals.length },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '24px', border: '1px solid var(--border-2)' }}>
                  <div className="display" style={{ fontSize: '48px', color: 'var(--ink)', marginBottom: '4px' }}>{s.value}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'View applications', desc: `${pending.length} pending review`, action: () => setTab('applications') },
                { label: 'Manage deals', desc: `${stats.deals} live deals`, action: () => setTab('deals') },
                { label: 'Business portal', desc: 'See what businesses see', action: () => window.open('/business/dashboard', '_blank') },
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 0.12s', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--ink)' }}>{a.label}</div>
                    <div style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500, marginTop: '2px' }}>{a.desc}</div>
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 900, color: 'var(--ink-4)' }}>+</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Applications */}
        {tab === 'applications' && (
          <div>
            <h2 className="display" style={{ fontSize: '40px', marginBottom: '20px' }}>Applications</h2>
            {applications.length === 0 ? (
              <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '32px', textAlign: 'center', border: '1px solid var(--border-2)' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-3)' }}>No applications yet.</p>
                <p style={{ fontSize: '14px', color: 'var(--ink-4)', marginTop: '4px' }}>Share your /for-business page to start getting applications.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {applications.map(app => (
                  <div key={app.id} style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '20px', border: `1px solid ${app.status === 'pending' ? 'var(--green)' : 'var(--border-2)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <div className="display" style={{ fontSize: '22px', marginBottom: '2px' }}>{app.business_name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--green-dk)', fontWeight: 700 }}>{app.deal_offer}</div>
                      </div>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '4px', flexShrink: 0, background: app.status === 'pending' ? 'var(--green-lt)' : app.status === 'approved' ? 'rgba(59,130,246,0.12)' : 'var(--red-lt)', color: app.status === 'pending' ? 'var(--green-dk)' : app.status === 'approved' ? '#1d4ed8' : 'var(--red)' }}>
                        {app.status}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                      {[
                        { l: 'Category', v: app.category },
                        { l: 'Address', v: app.address },
                        { l: 'Contact', v: app.contact_name },
                        { l: 'Email', v: app.contact_email },
                      ].map(f => (
                        <div key={f.l}>
                          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', marginBottom: '2px' }}>{f.l}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{f.v}</div>
                        </div>
                      ))}
                    </div>
                    {app.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => approveApplication(app)} disabled={approving === app.id} className="btn btn-primary" style={{ flex: 1, fontSize: '15px', padding: '12px' }}>
                          {approving === app.id ? 'Approving...' : 'Approve + go live'}
                        </button>
                        <button onClick={() => rejectApplication(app.id)} className="btn btn-outline" style={{ padding: '12px 20px', fontSize: '15px' }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deals */}
        {tab === 'deals' && (
          <div>
            <h2 className="display" style={{ fontSize: '40px', marginBottom: '20px' }}>Live Deals</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {deals.map(deal => (
                <div key={deal.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--ink)', marginBottom: '2px' }}>{deal.business_name}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green-dk)' }}>{deal.deal_description}</div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500, marginTop: '2px' }}>{deal.category} · {deal.address}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: deal.active ? 'var(--green)' : 'var(--ink-4)' }} />
                    <button onClick={() => toggleDeal(deal.id, deal.active)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: deal.active ? 'var(--red)' : 'var(--green-dk)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {deal.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}