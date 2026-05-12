'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { CATEGORY_OPTIONS, normalizeCategory } from '@/lib/product'

const OFFER_IDEAS = [
  '$2 off any coffee before 11am',
  '10% off lunch Monday-Friday',
  'Free side with any entree',
  '$10 off services over $50',
  '15% off first class pack',
  'Free topping with dessert order',
]

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
        body: JSON.stringify({ ...form, category: normalizeCategory(form.category), photo_url: photoUrl }),
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
          <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '16px' }}>You&apos;re on the list.</h1>
          <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', lineHeight: 1.55 }}>
            We review every application personally. You&apos;ll hear from us at <strong style={{ color: 'var(--ink)' }}>{form.contact_email}</strong> within 48 hours.
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
        <div className="fade-up-2" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'inline-block', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '4px 12px', borderRadius: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Not listed yet?</div>
          <h1 className="display" style={{ fontSize: 'clamp(52px, 10vw, 80px)', marginBottom: '16px' }}>Get new customers in 2 mins or less.<br /> Pay nothing.</h1>
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

        <div className="fade-up-2" style={{ background: 'var(--bg-2)', borderRadius: '12px', padding: '22px 20px', border: '1px solid var(--border-2)', marginBottom: '32px' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: '12px' }}>
            How it works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { step: '01', title: 'Your business', body: 'Tell us who you are, where you are, and the best email to reach you.' },
              { step: '02', title: 'Your first deal', body: 'Add the first offer you want members to see when you go live.' },
              { step: '03', title: 'We review + launch', body: 'We confirm the details, send your dashboard access, and get you listed.' },
            ].map((item) => (
              <div key={item.step} style={{ background: 'var(--bg)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)', minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green-dk)', marginBottom: '8px' }}>{item.step}</div>
                <div className="display" style={{ fontSize: '24px', marginBottom: '6px' }}>{item.title}</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500, lineHeight: 1.5 }}>{item.body}</p>
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
            <div style={{ background: 'var(--bg-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-2)' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: '6px' }}>
                Section 1
              </div>
              <div className="display" style={{ fontSize: '30px', marginBottom: '8px' }}>Business info.</div>
              <p style={{ fontSize: '14px', color: 'var(--ink-3)', fontWeight: 500, marginBottom: '16px' }}>This only needs the basics we need to review and list your business.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Business name *</label>
                  <input type="text" value={form.business_name} onChange={e => update('business_name', e.target.value)} placeholder="Fishtown Coffee Co." className="pp-input" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Category *</label>
                  <select value={form.category} onChange={e => update('category', e.target.value)} className="pp-input" style={{ cursor: 'pointer' }}>
                    <option value="">Select a category</option>
                    {CATEGORY_OPTIONS.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Business address *</label>
                  <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="1234 Frankford Ave, Philadelphia PA" className="pp-input" />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-2)' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: '6px' }}>
                Section 2
              </div>
              <div className="display" style={{ fontSize: '30px', marginBottom: '8px' }}>Your first deal.</div>
              <p style={{ fontSize: '14px', color: 'var(--ink-3)', fontWeight: 500, marginBottom: '16px' }}>This same format is what you’ll use later any time you submit another deal for review.</p>
              <div style={{ background: 'var(--bg)', borderRadius: '10px', padding: '14px 16px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '8px' }}>Best format</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    'Deal offer: what the member gets',
                    'Deal details: any fine print or limits',
                    'Business photo: optional, but helps a lot',
                  ].map((item) => (
                    <div key={item} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)' }}>{item}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Deal offer *</label>
                  <input type="text" value={form.deal_offer} onChange={e => update('deal_offer', e.target.value)} placeholder="e.g. 10% off any drink, $5 off first haircut" className="pp-input" />
                  <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>Keep it short and specific. Members will see this line first.</p>
                </div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '8px' }}>Offer ideas</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {OFFER_IDEAS.map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        onClick={() => update('deal_offer', idea)}
                        style={{
                          border: '1px solid var(--border-2)',
                          borderRadius: '999px',
                          background: form.deal_offer === idea ? 'var(--ink)' : 'var(--bg)',
                          color: form.deal_offer === idea ? 'var(--bg)' : 'var(--ink-3)',
                          padding: '7px 10px',
                          cursor: 'pointer',
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '8px', fontWeight: 500 }}>Tap one to use it, then customize it for your business.</p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                    Deal details <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-4)', fontSize: '12px' }}>(optional)</span>
                  </label>
                  <textarea value={form.deal_details} onChange={e => update('deal_details', e.target.value)} placeholder="e.g. Valid on orders over $10. One per visit. Cannot be combined with other offers." rows={3} className="pp-input" style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '15px', lineHeight: 1.5 }} />
                  <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>Use this for restrictions, exclusions, or anything your staff should know.</p>
                </div>
              </div>
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

            <div style={{ background: 'var(--bg-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-2)' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: '6px' }}>
                Section 3
              </div>
              <div className="display" style={{ fontSize: '30px', marginBottom: '8px' }}>Contact info.</div>
              <p style={{ fontSize: '14px', color: 'var(--ink-3)', fontWeight: 500, marginBottom: '16px' }}>We use this to review your listing and send your business dashboard access.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Your name *</label>
                  <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="Jane Smith" className="pp-input" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Email address *</label>
                  <input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} placeholder="you@yourbusiness.com" className="pp-input" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Phone number <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-4)', fontSize: '12px' }}>(optional)</span></label>
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(215) 555-0100" className="pp-input" />
                </div>
              </div>
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
