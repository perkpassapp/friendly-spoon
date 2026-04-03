'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

const CATEGORIES = ['Cafe', 'Restaurant', 'Barber', 'Nail Salon', 'Fitness', 'Pickleball', 'Wellness', 'Retail', 'Other']

export default function ForBusiness() {
  const [form, setForm] = useState({
    business_name: '', category: '', address: '',
    deal_offer: '', deal_details: '', contact_name: '', contact_email: '', phone: ''
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) { setError('Photo must be a JPG, PNG, or WebP image'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return }
    setError('')
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!form.business_name || !form.category || !form.address || !form.deal_offer || !form.contact_name || !form.contact_email) {
      setError('Please fill in all required fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      let photoUrl: string | null = null
      if (photoFile) {
        const photoData = new FormData()
        photoData.append('photo', photoFile)
        const photoRes = await fetch('/api/upload-business-photo', { method: 'POST', body: photoData })
        const photoJson = await photoRes.json()
        if (!photoJson.success) { setError(photoJson.error || 'Photo upload failed. Try again.'); setLoading(false); return }
        photoUrl = photoJson.photo_url
      }
      const res = await fetch('/api/business-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photo_url: photoUrl }),
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
          <div style={{ display: 'inline-block', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '4px 12px', borderRadius: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>Application received</div>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '16px' }}>You're on the list.</h1>
          <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', lineHeight: 1.55 }}>
            We review every application personally. You'll hear from us at <strong style={{ color: 'var(--ink)' }}>{form.contact_email}</strong> within 48 hours.
          </p>
          <div style={{ background: 'var(--forest)', borderRadius: '10px', padding: '24px', marginBottom: '24px', border: '2px solid var(--green)' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)', marginBottom: '12px' }}>What happens next</div>
            {['We review your application within 48 hours', 'You get a confirmation email with your business portal login', 'Your deal goes live to all Philly PerkPass members', 'Watch new customers walk through your door'].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: 'var(--green)', flexShrink: 0, fontSize: '14px' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{s}</span>
              </div>
            ))}
          </div>
          <Link href="/" className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px', display: 'flex' }}>Back to home</Link>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <Link href="/member/login" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', textDecoration: 'none' }}>Member login</Link>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px 80px', width: '100%' }}>
        <div className="fade-up" style={{ background: 'var(--forest)', borderRadius: '10px', padding: '28px', border: '2px solid var(--green)', marginBottom: '48px' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)', marginBottom: '8px' }}>Already a partner?</div>
          <div className="display" style={{ fontSize: '32px', color: '#ffffff', marginBottom: '8px' }}>View your dashboard.</div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: '16px' }}>See how many customers we sent you, peak times, deal performance, and more.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            {['Total redemptions this month', 'Busiest days and peak hours', 'Deal performance tracking', 'Live code verification scanner'].map(f => (
              <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: 'var(--green)', fontSize: '14px' }}>+</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
              </div>
            ))}
          </div>
          <a href="/business/dashboard" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 28px', display: 'inline-flex', textDecoration: 'none' }}>Log in to your dashboard</a>
        </div>

        <div className="fade-up-2" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'inline-block', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '4px 12px', borderRadius: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Not listed yet?</div>
          <h1 className="display" style={{ fontSize: 'clamp(52px, 10vw, 80px)', marginBottom: '16px' }}>Get new customers.<br /> Pay nothing.</h1>
          <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55, marginBottom: '32px' }}>List your business on PerkPass and we send you paying customers. You offer a small exclusive deal for the locals. We do the rest. Zero cost, zero risk.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2px', borderTop: '2px solid var(--ink)', paddingTop: '24px' }}>
            {[{ n: '$0', l: 'Cost to list' }, { n: '2min', l: 'To get verified' }, { n: '0%', l: 'Commission' }, { n: '100%', l: 'Your profits' }].map(s => (
              <div key={s.l}>
                <div className="display" style={{ fontSize: '36px', color: 'var(--green)' }}>{s.n}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="fade-up-2">
          <div style={{ borderTop: '2px solid var(--ink)', paddingTop: '32px', marginBottom: '32px' }}>
            <h2 className="display" style={{ fontSize: '40px', marginBottom: '8px' }}>Apply now.</h2>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)' }}>Takes 2 minutes to apply. We review every application and will contact you with any questions.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Business name *</label>
              <input type="text" value={form.business_name} onChange={e => update('business_name', e.target.value)} placeholder="Fishtown Coffee Co." className="pp-input" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Category *</label>
              <select value={form.category} onChange={e => update('category', e.target.value)} className="pp-input" style={{ cursor: 'pointer' }}>
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Business address *</label>
              <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="1234 Frankford Ave, Philadelphia PA" className="pp-input" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Your deal offer *</label>
              <input type="text" value={form.deal_offer} onChange={e => update('deal_offer', e.target.value)} placeholder="e.g. 10% off any drink, $5 off first haircut" className="pp-input" />
              <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>Keep it simple. The best deals are specific and easy to apply at the register.</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Deal details <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-4)', fontSize: '12px' }}>(optional)</span>
              </label>
              <textarea value={form.deal_details} onChange={e => update('deal_details', e.target.value)} placeholder="e.g. Valid on orders over $10. One per visit. Cannot be combined with other offers." rows={3} className="pp-input" style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '15px', lineHeight: 1.5 }} />
              <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>Any fine print, restrictions, or extra context members should know. Shown under your deal on the deals page.</p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                Business photo <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-4)', fontSize: '12px' }}>(optional)</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} style={{ display: 'none' }} />
              {photoPreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={photoPreview} alt="Business photo preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--border)', display: 'block' }} />
                  <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>Remove</button>
                  <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>{photoFile?.name} — looks good! You can change it after approval from your dashboard.</p>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '28px 24px', border: '2px dashed var(--border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--ink-4)' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Upload a photo</span>
                  <span style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500 }}>JPG, PNG or WebP, up to 5MB</span>
                </button>
              )}
              <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>This is what members see on the deals page. A photo of your storefront, food, or space works great.</p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: '8px' }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>Your contact info</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Your name *</label>
              <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="Jane Smith" className="pp-input" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Email address *</label>
              <input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} placeholder="you@yourbusiness.com" className="pp-input" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Phone number *</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(215) 555-0100" className="pp-input" />
            </div>

            {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>{error}</p>}
            <button onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ width: '100%', fontSize: '18px', padding: '18px' }}>
              {loading ? 'Submitting...' : 'Submit application'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>No contracts. No fees. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
