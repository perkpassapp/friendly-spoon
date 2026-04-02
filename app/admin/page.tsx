'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Application = {
  id: string; business_name: string; category: string; address: string
  deal_offer: string; deal_details: string | null; contact_name: string
  contact_email: string; phone: string; status: string; created_at: string
}
type Deal = {
  id: string; business_name: string; deal_description: string; category: string
  address: string; active: boolean; admin_disabled: boolean; photo_url?: string | null; featured: boolean
}
type Business = {
  id: string; business_name: string; category: string; address: string
  contact_email: string; active: boolean; admin_disabled: boolean
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'applications' | 'deals' | 'businesses'>('overview')
  const [applications, setApplications] = useState<Application[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [stats, setStats] = useState({ members: 0, redemptions: 0, deals: 0 })
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [togglingBiz, setTogglingBiz] = useState<string | null>(null)
  const [deletingDeal, setDeletingDeal] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editingDeal, setEditingDeal] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<{ deal_description: string; category: string }>({ deal_description: '', category: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)

  async function loadData() {
    setLoading(true)
    const [appsRes, dealsRes, redemptionsRes, bizRes, membersRes] = await Promise.all([
      supabase.from('business_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('deals').select('*').order('created_at', { ascending: false }),
      supabase.from('redemptions').select('id'),
      supabase.from('business_accounts').select('*').order('business_name'),
      supabase.from('members').select('id'),
    ])
    setApplications(appsRes.data || [])
    setDeals(dealsRes.data || [])
    setBusinesses(bizRes.data || [])
    setStats({ members: membersRes.data?.length || 0, redemptions: redemptionsRes.data?.length || 0, deals: dealsRes.data?.filter((d: Deal) => d.active && !d.admin_disabled).length || 0 })
    setLoading(false)
  }

  async function approveApplication(app: Application) {
    setApproving(app.id)
    await supabase.from('deals').insert({ business_name: app.business_name, deal_description: app.deal_offer, deal_details: app.deal_details || null, category: app.category, address: app.address, emoji: '🎟️', active: true, admin_disabled: false })
    await supabase.from('business_accounts').insert({ business_name: app.business_name, category: app.category, address: app.address, deal_offer: app.deal_offer, contact_email: app.contact_email.toLowerCase().trim(), active: true, admin_disabled: false })
    await supabase.from('business_applications').update({ status: 'approved' }).eq('id', app.id)
    await loadData(); setApproving(null)
  }

  async function rejectApplication(id: string) {
    await supabase.from('business_applications').update({ status: 'rejected' }).eq('id', id)
    await loadData()
  }

  async function adminToggleDeal(deal: Deal) {
    const disabling = !deal.admin_disabled
    await supabase.from('deals').update({ admin_disabled: disabling, active: disabling ? false : deal.active }).eq('id', deal.id)
    await loadData()
  }

  async function toggleFeatured(deal: Deal) {
    await supabase.from('deals').update({ featured: !deal.featured }).eq('id', deal.id)
    await loadData()
  }

  async function deleteDeal(id: string) {
    setDeletingDeal(id)
    await supabase.from('deals').delete().eq('id', id)
    setConfirmDelete(null); await loadData(); setDeletingDeal(null)
  }

  function startEdit(deal: Deal) {
    setEditingDeal(deal.id)
    setEditFields({ deal_description: deal.deal_description, category: deal.category })
    setConfirmDelete(null)
  }

  async function saveEdit(id: string) {
    setSavingEdit(true)
    await supabase.from('deals').update({ deal_description: editFields.deal_description, category: editFields.category }).eq('id', id)
    setEditingDeal(null); setSavingEdit(false); await loadData()
  }

  async function handleAdminPhotoUpload(deal: Deal, file: File) {
    setPhotoUploading(true)
    const { data: bizData } = await supabase.from('business_accounts').select('id').eq('business_name', deal.business_name).limit(1)
    const bizId = bizData?.[0]?.id || deal.id
    const ext = file.name.split('.').pop()
    const path = bizId + '/photo.' + ext
    await supabase.storage.from('business-photos').upload(path, file, { upsert: true, contentType: file.type })
    const { data: urlData } = supabase.storage.from('business-photos').getPublicUrl(path)
    const url = urlData.publicUrl + '?t=' + Date.now()
    await supabase.from('deals').update({ photo_url: url }).eq('business_name', deal.business_name)
    setPhotoUploading(false); await loadData()
  }

  async function removePhoto(deal: Deal) {
    await supabase.from('deals').update({ photo_url: null }).eq('business_name', deal.business_name)
    await loadData()
  }

  async function toggleBusiness(biz: Business) {
    setTogglingBiz(biz.id)
    const disabling = !biz.admin_disabled
    await supabase.from('business_accounts').update({ admin_disabled: disabling }).eq('id', biz.id)
    if (disabling) { await supabase.from('deals').update({ admin_disabled: true, active: false }).eq('business_name', biz.business_name) }
    else { await supabase.from('deals').update({ admin_disabled: false }).eq('business_name', biz.business_name) }
    await loadData(); setTogglingBiz(null)
  }

  function login() {
    if (password === 'perkpassadmin') { setAuthed(true); loadData() } else setError('Wrong password')
  }

  const pending = applications.filter(a => a.status === 'pending')
  const activeBusinesses = businesses.filter(b => !b.admin_disabled).length
  const disabledBusinesses = businesses.filter(b => b.admin_disabled).length
  const LABEL = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--ink-4)' }
  const INPUT_STYLE = { fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'var(--ink)', background: 'var(--bg)', border: '1.5px solid var(--ink)', borderRadius: '6px', padding: '8px 10px', width: '100%', outline: 'none' }

  if (!authed) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/admin" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h1 className="display fade-up" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '8px' }}>Admin.</h1>
          <p className="fade-up-2" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>Your command center.</p>
          <div className="fade-up-3">
            <label style={{ display: 'block', marginBottom: '6px', ...LABEL }}>Password</label>
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
          <Link href="/admin" className="pp-logo">Perk<span>Pass</span></Link>
          <span style={{ ...LABEL, color: 'var(--ink-4)' }}>Admin</span>
        </div>
        <button onClick={() => setAuthed(false)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
      </header>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '2px solid var(--ink)'}}>
          {([{ key: 'overview', label: 'Overview' }, { key: 'applications', label: 'Applications' + (pending.length > 0 ? ' (' + pending.length + ')' : '') }, { key: 'deals', label: 'Live Deals' }, { key: 'businesses', label: 'Businesses' + (disabledBusinesses > 0 ? ' (' + disabledBusinesses + ' off)' : '') }] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 16px', border: 'none', cursor: 'pointer', background: 'none', color: tab === t.key ? 'var(--ink)' : 'var(--ink-4)', borderBottom: tab === t.key ? '2px solid var(--ink)' : '2px solid transparent', marginBottom: '-2px', flexShrink: 0 }}>{t.label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <h2 className="display" style={{ fontSize: '40px', marginBottom: '20px' }}>Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '32px' }}>
              {[{ label: 'Active members', value: stats.members }, { label: 'Total redemptions', value: stats.redemptions }, { label: 'Active deals', value: stats.deals }, { label: 'Active businesses', value: activeBusinesses }].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '24px', border: '1px solid var(--border-2)' }}>
                  <div className="display" style={{ fontSize: '48px', color: 'var(--ink)', marginBottom: '4px' }}>{s.value}</div>
                  <div style={{ ...LABEL }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[{ label: 'View applications', desc: pending.length + ' pending review', action: () => setTab('applications') }, { label: 'Manage deals', desc: stats.deals + ' live deals', action: () => setTab('deals') }, { label: 'Manage businesses', desc: activeBusinesses + ' active · ' + disabledBusinesses + ' disabled', action: () => setTab('businesses') }, { label: 'Business portal', desc: 'See what businesses see', action: () => window.open('/business/dashboard', '_blank') }].map(a => (
                <button key={a.label} onClick={a.action} style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}>
                  <div><div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--ink)' }}>{a.label}</div><div style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500, marginTop: '2px' }}>{a.desc}</div></div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 900, color: 'var(--ink-4)' }}>+</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'applications' && (
          <div>
            <h2 className="display" style={{ fontSize: '40px', marginBottom: '20px' }}>Applications</h2>
            {applications.length === 0 ? (
              <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '32px', textAlign: 'center', border: '1px solid var(--border-2)' }}><p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-3)' }}>No applications yet.</p><p style={{ fontSize: '14px', color: 'var(--ink-4)', marginTop: '4px' }}>Share your /for-business page to start getting applications.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {applications.map(app => (
                  <div key={app.id} style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '20px', border: '1px solid ' + (app.status === 'pending' ? 'var(--green)' : 'var(--border-2)') }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                      <div><div className="display" style={{ fontSize: '22px', marginBottom: '2px' }}>{app.business_name}</div><div style={{ fontSize: '13px', color: 'var(--green-dk)', fontWeight: 700 }}>{app.deal_offer}</div>{app.deal_details && <div style={{ fontSize: '12px', color: 'var(--ink-3)', fontWeight: 500, marginTop: '3px', lineHeight: 1.5 }}>{app.deal_details}</div>}</div>
                      <span style={{ ...LABEL, padding: '4px 10px', borderRadius: '4px', flexShrink: 0, background: app.status === 'pending' ? 'var(--green-lt)' : app.status === 'approved' ? 'rgba(59,130,246,0.12)' : 'var(--red-lt)', color: app.status === 'pending' ? 'var(--green-dk)' : app.status === 'approved' ? '#1d4ed8' : 'var(--red)' }}>{app.status}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                      {[{ l: 'Category', v: app.category }, { l: 'Address', v: app.address }, { l: 'Contact', v: app.contact_name }, { l: 'Email', v: app.contact_email }].map(f => (<div key={f.l}><div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', marginBottom: '2px' }}>{f.l}</div><div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{f.v}</div></div>))}
                    </div>
                    {app.status === 'pending' && (<div style={{ display: 'flex', gap: '8px' }}><button onClick={() => approveApplication(app)} disabled={approving === app.id} className="btn btn-primary" style={{ flex: 1, fontSize: '15px', padding: '12px' }}>{approving === app.id ? 'Approving...' : 'Approve + go live'}</button><button onClick={() => rejectApplication(app.id)} className="btn btn-outline" style={{ padding: '12px 20px', fontSize: '15px' }}>Reject</button></div>)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'deals' && (
          <div>
            <h2 className="display" style={{ fontSize: '40px', marginBottom: '4px' }}>Live Deals</h2>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-4)', marginBottom: '20px' }}>Deals you disable here cannot be re-activated by the business. Delete removes permanently.</p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {deals.map((deal: Deal) => (
                <div key={deal.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', opacity: deal.admin_disabled && editingDeal !== deal.id ? 0.5 : 1 }}>
                  {confirmDelete === deal.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--red-lt)', borderRadius: '8px', padding: '14px 16px' }}>
                      <div style={{ flex: 1 }}><div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase' }}>Delete {deal.business_name}?</div><div style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 500, opacity: 0.8, marginTop: '2px' }}>This cannot be undone.</div></div>
                      <button onClick={() => deleteDeal(deal.id)} disabled={deletingDeal === deal.id} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'var(--red)', color: '#fff', flexShrink: 0 }}>{deletingDeal === deal.id ? '...' : 'Confirm'}</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--red)', cursor: 'pointer', background: 'none', color: 'var(--red)', flexShrink: 0 }}>Cancel</button>
                    </div>
                  ) : editingDeal === deal.id ? (
                    <div style={{ background: 'var(--bg-2)', border: '1.5px solid var(--ink)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 800, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase' }}>{deal.business_name}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Deal Description</label>
                          <input style={INPUT_STYLE} value={editFields.deal_description} onChange={e => setEditFields(f => ({ ...f, deal_description: e.target.value }))} placeholder="e.g. 10% off any order" />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Category</label>
                          <input style={INPUT_STYLE} value={editFields.category} onChange={e => setEditFields(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Restaurant" />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', ...LABEL }}>Business Photo</label>
                          {deal.photo_url && (
                            <div style={{ borderRadius: '6px', overflow: 'hidden', height: '100px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                              <img src={deal.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ ...INPUT_STYLE, padding: '6px 8px', cursor: 'pointer', flex: 1 }} disabled={photoUploading} onChange={async e => { const file = e.target.files?.[0]; if (file) await handleAdminPhotoUpload(deal, file) }} />
                            {deal.photo_url && (
                              <button onClick={() => removePhoto(deal)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--red)', background: 'none', border: '1px solid var(--red)', borderRadius: '4px', padding: '7px 12px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>Remove photo</button>
                            )}
                          </div>
                          {photoUploading && <p style={{ fontSize: '11px', color: 'var(--ink-4)', fontWeight: 600, marginTop: '4px' }}>Uploading...</p>}
                          <p style={{ fontSize: '11px', color: 'var(--ink-4)', fontWeight: 500, marginTop: '4px' }}>JPG, PNG or WebP · applies to all deals for this business</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => saveEdit(deal.id)} disabled={savingEdit} className="btn btn-primary" style={{ fontSize: '14px', padding: '10px 20px' }}>{savingEdit ? 'Saving...' : 'Save changes'}</button>
                        <button onClick={() => setEditingDeal(null)} className="btn btn-outline" style={{ fontSize: '14px', padding: '10px 20px' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {deal.photo_url && (
                        <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                          <img src={deal.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>{deal.business_name}</div>
                          {deal.admin_disabled && <span style={{ ...LABEL, fontSize: '10px', background: 'var(--red-lt)', color: 'var(--red)', padding: '2px 8px', borderRadius: '3px' }}>Admin disabled</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green-dk)' }}>{deal.deal_description}</div>
                          {deal.featured && <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '2px 8px', borderRadius: '3px' }}>Featured</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500, marginTop: '2px' }}>{deal.category} · {deal.address}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: deal.active && !deal.admin_disabled ? 'var(--green)' : 'var(--ink-4)' }} />
                        <button onClick={() => startEdit(deal)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                        <span style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>
                        <button onClick={() => toggleFeatured(deal)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: deal.featured ? 'var(--green-dk)' : 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}>{deal.featured ? '★ Featured' : '☆ Feature'}</button>
                        <span style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>
                        <button onClick={() => adminToggleDeal(deal)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: deal.admin_disabled ? 'var(--green-dk)' : 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>{deal.admin_disabled ? 'Re-enable' : 'Disable'}</button>
                        <span style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>
                        <button onClick={() => { setConfirmDelete(deal.id); setEditingDeal(null) }} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'businesses' && (
          <div>
            <h2 className="display" style={{ fontSize: '40px', marginBottom: '4px' }}>Businesses</h2>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-4)', marginBottom: '20px' }}>Disabling a business removes them from the platform and deactivates all their deals.</p>
            {businesses.length === 0 ? (
              <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '32px', textAlign: 'center', border: '1px solid var(--border-2)' }}><p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-3)' }}>No businesses yet.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {businesses.map((biz: Business) => (
                  <div key={biz.id} style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '18px 20px', border: '1px solid ' + (biz.admin_disabled ? 'var(--red)' : 'var(--border-2)'), display: 'flex', alignItems: 'center', gap: '16px', opacity: biz.admin_disabled ? 0.6 : 1 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>{biz.business_name}</div>
                        {biz.admin_disabled && <span style={{ ...LABEL, fontSize: '10px', background: 'var(--red-lt)', color: 'var(--red)', padding: '2px 8px', borderRadius: '3px' }}>Disabled</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500 }}>{biz.category} · {biz.address}</div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500 }}>{biz.contact_email}</div>
                    </div>
                    <button onClick={() => toggleBusiness(biz)} disabled={togglingBiz === biz.id} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 18px', borderRadius: '6px', border: 'none', cursor: 'pointer', flexShrink: 0, background: biz.admin_disabled ? 'var(--green-lt)' : 'var(--red-lt)', color: biz.admin_disabled ? 'var(--green-dk)' : 'var(--red)' }}>
                      {togglingBiz === biz.id ? '...' : biz.admin_disabled ? 'Re-enable' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
