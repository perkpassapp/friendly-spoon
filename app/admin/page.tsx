'use client'
import { useState } from 'react'
import Link from 'next/link'

const STATS = [
  { label: 'Total Members', value: '0' },
  { label: 'Active Deals', value: '5' },
  { label: 'Redemptions', value: '0' },
  { label: 'Monthly Revenue', value: '$0' },
]

const DEALS = [
  { biz: 'Fishtown Coffee Co.', deal: '20% off any drink', cat: 'Cafe' },
  { biz: 'The Craft Barber', deal: '$10 off first haircut', cat: 'Barber' },
  { biz: 'Iron Body Gym', deal: 'Free 1-week trial', cat: 'Fitness' },
  { biz: 'Bliss Nail Studio', deal: '30% off mani-pedi', cat: 'Nails' },
  { biz: 'Compadre Taqueria', deal: 'Buy 1 get 1 free', cat: 'Restaurant' },
]

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')

  function login() {
    if (password === 'perkpassadmin') setAuthed(true)
    else setError('Wrong password')
  }

  if (!authed) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h1 className="display fade-up" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '8px' }}>
            Admin.
          </h1>
          <p className="fade-up-2" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>
            Enter your password to continue.
          </p>
          <div className="fade-up-3">
            <label style={{
              display: 'block', marginBottom: '6px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '13px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--ink-3)',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              className="pp-input"
              style={{ marginBottom: '10px' }}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
            {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '10px' }}>{error}</p>}
            <button onClick={login} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '15px' }}>
              Enter dashboard
            </button>
            <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '10px', textAlign: 'center', fontWeight: 500 }}>
              Default: perkpassadmin
            </p>
          </div>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '2px solid var(--ink)',
        padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '13px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--ink-4)',
          }}>Admin</span>
        </div>
        <button
          onClick={() => setAuthed(false)}
          style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </header>

      <div style={{ padding: '32px 24px', maxWidth: '720px', margin: '0 auto' }}>

        {/* Stats */}
        <h2 className="display" style={{ fontSize: '40px', marginBottom: '20px' }}>Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '48px' }}>
          {STATS.map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-2)', padding: '24px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}>
              <div className="display" style={{ fontSize: '48px', color: 'var(--ink)', marginBottom: '4px' }}>{s.value}</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '12px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--ink-4)',
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Deals */}
        <h2 className="display" style={{ fontSize: '40px', marginBottom: '20px' }}>Active Deals</h2>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '48px' }}>
          {DEALS.map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 0', borderBottom: '1px solid var(--border)',
              gap: '12px',
            }}>
              <div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '18px', fontWeight: 800,
                  color: 'var(--ink)', letterSpacing: '-0.01em',
                }}>
                  {d.biz}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green-dk)', marginTop: '2px' }}>{d.deal}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--ink-4)',
                }}>{d.cat}</span>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--green)',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <h2 className="display" style={{ fontSize: '40px', marginBottom: '20px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Add new deal', desc: 'Onboard a new Philly business' },
            { label: 'View all members', desc: 'See every active subscription' },
            { label: 'Export redemptions', desc: 'Download CSV of all usage' },
          ].map(a => (
            <button key={a.label} style={{
              background: 'var(--bg-2)', border: '1px solid var(--border-2)',
              borderRadius: '8px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'border-color 0.12s',
              textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
            >
              <div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '17px', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.02em',
                  color: 'var(--ink)',
                }}>{a.label}</div>
                <div style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500, marginTop: '2px' }}>{a.desc}</div>
              </div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '20px', fontWeight: 900, color: 'var(--ink-4)',
              }}>+</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}