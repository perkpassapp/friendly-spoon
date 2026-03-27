'use client'
import { useState } from 'react'
import Link from 'next/link'

const CATEGORIES = ['Cafe', 'Restaurant', 'Barber', 'Nail Salon', 'Fitness', 'Pickleball', 'Wellness', 'Retail', 'Other']

export default function ForBusiness() {
  const [form, setForm] = useState({
    business_name: '', category: '', address: '',
    deal_offer: '', contact_name: '', contact_email: '', phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.business_name || !form.category || !form.address || !form.deal_offer || !form.contact_name || !form.contact_email) {
      setError('Please fill in all required fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/business-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) setSubmitted(true)
      else setError(data.error || 'Something went wrong. Try again.')
    } catch {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  if (submitted) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '440px', width: '100%' }}>
          <div style={{ display: 'inline-block', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '4px 12px', borderRadius: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>
            Application received
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '16px' }}>
            You're on the list.
          </h1>
          <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', lineHeight: 1.55 }}>
            We review every application personally. You'll hear from us at <strong style={{ color: 'var(--ink)' }}>{form.contact_email}</strong> within 48 hours.
          </p>
          <div style={{ background: 'var(--forest)', borderRadius: '10px', padding: '24px', marginBottom: '24px', border: '2px solid var(--green)' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)', marginBottom: '12px' }}>
              What happens next
            </div>
            {['We review your application within 48 hours', 'You get a confirmation email with your business portal login', 'Your deal goes live to all Philly PerkPass members', 'Watch new customers walk through your door'].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: 'var(--green)', flexShrink: 0, fontSize: '14px' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{s}</span>
              </div>
            ))}
          </div>
          <Link href="/" className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px', display: 'flex' }}>
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <Link href="/member/login" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', textDecoration: 'none' }}>
          Member login
        </Link>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 80px', width: '100%' }}>

        {/* Hero */}
        <div className="fade-up" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'inline-block', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '4px 12px', borderRadius: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
            For businesses
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(52px, 10vw, 80px)', marginBottom: '16px' }}>
            Get new customers.<br />Pay nothing.
          </h1>
          <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55, marginBottom: '32px' }}>
            List your business on PerkPass and we send you paying Philadelphia customers. You offer a small deal. We do the rest. Zero cost, zero risk.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', borderTop: '2px solid var(--ink)', paddingTop: '24px' }}>
            {[{ n: '$0', l: 'Cost to list' }, { n: '2min', l: 'To get verified' }, { n: '0%', l: 'Commission' }].map(s => (
              <div key={s.l}>
                <div className="display" style={{ fontSize: '36px', color: 'var(--green)' }}>{s.n}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="fade-up-2">
          <div style={{ borderTop: '2px solid var(--ink)', paddingTop: '32px', marginBottom: '32px' }}>
            <h2 className="display" style={{ fontSize: '40px', marginBottom: '8px' }}>Apply now.</h2>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)' }}>Takes 2 minutes. We review every application personally.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Business name */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Business name *
              </label>
              <input type="text" value={form.business_name} onChange={e => update('business_name', e.target.value)} placeholder="Fishtown Coffee Co." className="pp-input" />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Category *
              </label>
              <select value={form.category} onChange={e => update('category', e.target.value)} className="pp-input" style={{ cursor: 'pointer' }}>
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Address */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Business address *
              </label>
              <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="1234 Frankford Ave, Philadelphia PA" className="pp-input" />
            </div>

            {/* Deal offer */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Your deal offer *
              </label>
              <input type="text" value={form.deal_offer} onChange={e => update('deal_offer', e.target.value)} placeholder="e.g. 20% off any drink, $10 off first haircut" className="pp-input" />
              <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>
                Keep it simple. The best deals are specific and easy to apply at the register.
              </p>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: '8px' }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>
                Your contact info
              </p>
            </div>

            {/* Contact name */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Your name *
              </label>
              <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="Jane Smith" className="pp-input" />
            </div>

            {/* Contact email */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Email address *
              </label>
              <input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} placeholder="you@yourbusiness.com" className="pp-input" />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Phone number
              </label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(215) 555-0100" className="pp-input" />
            </div>

            {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>{error}</p>}

            <button onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ width: '100%', fontSize: '18px', padding: '18px' }}>
              {loading ? 'Submitting...' : 'Submit application'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>
              No contracts. No fees. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}