'use client'
import { useState } from 'react'
import Link from 'next/link'

type Result = {
  valid: boolean
  business?: string
  deal?: string
  member?: string
  reason?: string
}

export default function BusinessScan() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)

  async function verifyCode() {
    setLoading(true)
    try {
      const res = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ valid: false, reason: 'Connection error. Try again.' })
    }
    setLoading(false)
  }

  function reset() { setCode(''); setResult(null) }

  if (result?.valid) return (
    <main style={{ minHeight: '100vh', background: '#1a2e1a', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px',
        borderBottom: '2px solid rgba(95,160,97,0.3)',
      }}>
        <Link href="/business/dashboard" className="pp-logo pp-logo-light" style={{ color: '#ffffff' }}>Perk<span>Pass</span></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--green)', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 16L13 23L26 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="display" style={{ fontSize: '72px', color: '#ffffff', marginBottom: '8px' }}>Valid.</h1>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '28px', fontWeight: 900, letterSpacing: '0.06em',
            color: 'var(--green)', marginBottom: '24px',
          }}>{code}</div>

          <div style={{
            background: 'rgba(95,160,97,0.15)', border: '1px solid rgba(95,160,97,0.3)',
            borderRadius: '8px', padding: '20px', marginBottom: '32px', textAlign: 'left',
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--green)', marginBottom: '12px',
            }}>Deal details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Business: </span>
                <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>{result.business}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Deal: </span>
                <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>{result.deal}</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(95,160,97,0.1)', borderRadius: '8px',
            padding: '16px', marginBottom: '32px',
          }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Apply the discount now.</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: 500 }}>
              This code has been marked as used.
            </p>
          </div>
          <button onClick={reset} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px' }}>
            Scan next code
          </button>
        </div>
      </div>
    </main>
  )

  if (result && !result.valid) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', padding: '0 24px',
        height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/business/dashboard" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--red-lt)', border: '2px solid var(--red)',
            margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 8L24 24M24 8L8 24" stroke="var(--red)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="display" style={{ fontSize: '72px', marginBottom: '8px' }}>Invalid.</h1>
          <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '12px' }}>
            {result.reason || 'This code is expired or already used.'}
          </p>
          <div style={{
            background: 'var(--red-lt)', border: '1px solid var(--red)',
            borderRadius: '8px', padding: '16px', marginBottom: '32px',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--red)' }}>Do not apply the discount.</p>
            <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginTop: '4px', fontWeight: 500 }}>
              Ask the customer to generate a new code from their app.
            </p>
          </div>
          <button onClick={reset} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px' }}>
            Try again
          </button>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/business/dashboard" className="pp-logo">Perk<span>Pass</span></Link>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--ink-4)',
        }}>Business portal</span>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div className="fade-up" style={{ marginBottom: '40px' }}>
            <h1 className="display" style={{ fontSize: 'clamp(52px, 12vw, 72px)', marginBottom: '8px' }}>
              Verify code.
            </h1>
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)' }}>
              Enter the 6-character code from the member's screen.
            </p>
          </div>

          <div className="fade-up-2">
            <label style={{
              display: 'block', marginBottom: '6px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '13px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--ink-3)',
            }}>Member code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="ABC123"
              className="pp-input"
              style={{
                marginBottom: '12px',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '36px', fontWeight: 900,
                letterSpacing: '0.12em', textAlign: 'center',
                padding: '20px 16px',
              }}
              maxLength={6}
            />

            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: i < code.length ? 'var(--green)' : 'var(--bg-3)',
                  transition: 'background 0.15s',
                }} />
              ))}
            </div>

            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '18px', padding: '16px', marginBottom: '16px' }}
            >
              {loading ? 'Checking...' : 'Verify code'}
            </button>

            <div style={{
              background: 'var(--bg-2)', border: '1px solid var(--border-2)',
              borderRadius: '8px', padding: '16px',
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--ink-3)', marginBottom: '8px',
              }}>How this works</div>
              {[
                'Ask member to open PerkPass and tap Redeem',
                'They get a 6-letter code valid for 2 minutes',
                'Enter it above — green means apply the discount',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700, color: 'var(--green)', flexShrink: 0, fontSize: '14px',
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
