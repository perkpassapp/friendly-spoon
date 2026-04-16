'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { CATEGORY_OPTIONS, normalizeCategory } from '@/lib/product'

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
  address: string; active: boolean; admin_disabled: boolean; photo_url?: string | null; featured: boolean; schedule?: Schedule | null; deal_details?: string | null
}
type Business = {
  id: string; business_name: string; category: string; address: string
  contact_email: string; active: boolean; admin_disabled: boolean
  deal_offer?: string | null; access_code?: string | null; photo_url?: string | null
  source?: 'account' | 'approved_application'
  application_id?: string
}

type Schedule = { days: number[]; start: string; end: string }

type BusinessEditFields = {
  business_name: string
  category: string
  address: string
  contact_email: string
  deal_offer: string
  deal_description: string
}

type DirectBusinessForm = {
  business_name: string
  category: string
  address: string
  deal_offer: string
  deal_details: string
  contact_name: string
  contact_email: string
  phone: string
}

type ExistingBusinessDealForm = {
  business_id: string
  deal_description: string
  deal_details: string
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
  const [approving, setApproving] = useState<string | null>(null)
  const [togglingBiz, setTogglingBiz] = useState<string | null>(null)
  const [deletingBusiness, setDeletingBusiness] = useState<string | null>(null)
  const [confirmBusinessDelete, setConfirmBusinessDelete] = useState<string | null>(null)
  const [deletingDeal, setDeletingDeal] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editingDeal, setEditingDeal] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<{ deal_description: string; deal_details: string; category: string }>({ deal_description: '', deal_details: '', category: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Deal | null>(null)
  const [schedDays, setSchedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [schedStart, setSchedStart] = useState('09:00')
  const [schedEnd, setSchedEnd] = useState('21:00')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<string | null>(null)
  const [businessEditFields, setBusinessEditFields] = useState<BusinessEditFields>({
    business_name: '',
    category: '',
    address: '',
    contact_email: '',
    deal_offer: '',
    deal_description: '',
  })
  const [savingBusinessEdit, setSavingBusinessEdit] = useState(false)
  const [directForm, setDirectForm] = useState<DirectBusinessForm>({
    business_name: '',
    category: '',
    address: '',
    deal_offer: '',
    deal_details: '',
    contact_name: '',
    contact_email: '',
    phone: '',
  })
  const [addingBusiness, setAddingBusiness] = useState(false)
  const [directError, setDirectError] = useState('')
  const [existingDealForm, setExistingDealForm] = useState<ExistingBusinessDealForm>({
    business_id: '',
    deal_description: '',
    deal_details: '',
  })
  const [addingExistingDeal, setAddingExistingDeal] = useState(false)
  const [existingDealError, setExistingDealError] = useState('')
  const [dealBusinessFilter, setDealBusinessFilter] = useState<string>('all')

  async function loadData() {
    const [appsRes, dealsRes, redemptionsRes, bizRes, membersRes] = await Promise.all([
      supabase.from('business_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('deals').select('*').order('created_at', { ascending: false }),
      supabase.from('redemptions').select('id'),
      supabase.from('business_accounts').select('*').order('business_name'),
      supabase.from('members').select('id'),
    ])
    const normalizedApplications = (appsRes.data || []).map((app) => ({ ...app, category: normalizeCategory(app.category) }))
    const normalizedDeals = (dealsRes.data || []).map((deal) => ({ ...deal, category: normalizeCategory(deal.category) }))
    const businessMap = new Map<string, Business>()
    ;(bizRes.data || []).forEach((biz) => {
      const normalizedBiz = { ...biz, category: normalizeCategory(biz.category), source: 'account' as const }
      businessMap.set(normalizedBiz.business_name.trim().toLowerCase(), normalizedBiz)
    })
    normalizedApplications
      .filter((app) => app.status === 'approved')
      .forEach((app) => {
        const key = app.business_name.trim().toLowerCase()
        if (businessMap.has(key)) return
        businessMap.set(key, {
          id: `application:${app.id}`,
          application_id: app.id,
          source: 'approved_application',
          business_name: app.business_name,
          category: normalizeCategory(app.category),
          address: app.address,
          contact_email: app.contact_email,
          active: true,
          admin_disabled: false,
          deal_offer: app.deal_offer,
          access_code: null,
          photo_url: null,
        })
      })
    setApplications(normalizedApplications)
    setDeals(normalizedDeals)
    setBusinesses(Array.from(businessMap.values()).sort((a, b) => a.business_name.localeCompare(b.business_name)))
    setStats({ members: membersRes.data?.length || 0, redemptions: redemptionsRes.data?.length || 0, deals: dealsRes.data?.filter((d: Deal) => d.active && !d.admin_disabled).length || 0 })
  }

  async function approveApplication(app: Application) {
    setApproving(app.id)
    const category = normalizeCategory(app.category)
    // Carry over existing photo_url if this business already has one
    const { data: existingAccount } = await supabase
      .from('business_accounts')
      .select('photo_url')
      .eq('business_name', app.business_name)
      .maybeSingle()
    const photoUrl = existingAccount?.photo_url || null

    await supabase.from('deals').insert({ business_name: app.business_name, deal_description: app.deal_offer, deal_details: app.deal_details || null, category, emoji: '🎟️', address: app.address, active: true, admin_disabled: false, photo_url: photoUrl })
    await supabase.from('business_accounts').upsert({ business_name: app.business_name, category, address: app.address, deal_offer: app.deal_offer, contact_email: app.contact_email.toLowerCase().trim(), active: true, admin_disabled: false }, { onConflict: 'business_name' })
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
    if (deal.admin_disabled || !deal.active) return
    if (deal.featured) {
      await supabase.from('deals').update({ featured: false }).eq('id', deal.id)
      await loadData()
      return
    }
    await supabase.from('deals').update({ featured: false }).eq('business_name', deal.business_name)
    await supabase.from('deals').update({ featured: true }).eq('id', deal.id)
    await loadData()
  }

  async function deleteDeal(id: string) {
    setDeletingDeal(id)
    await supabase.from('deals').delete().eq('id', id)
    setConfirmDelete(null); await loadData(); setDeletingDeal(null)
  }

  async function archiveDeal(id: string) {
    setDeletingDeal(id)
    await supabase.from('deals').update({ active: false, admin_disabled: true, featured: false }).eq('id', id)
    setConfirmDelete(null); await loadData(); setDeletingDeal(null)
  }

  function startEdit(deal: Deal) {
    setEditingDeal(deal.id)
    setEditFields({ deal_description: deal.deal_description, deal_details: deal.deal_details || '', category: normalizeCategory(deal.category) })
    setConfirmDelete(null)
  }

  async function saveEdit(id: string) {
    setSavingEdit(true)
    await supabase.from('deals').update({
      deal_description: editFields.deal_description.trim(),
      deal_details: editFields.deal_details.trim() || null,
      category: normalizeCategory(editFields.category),
    }).eq('id', id)
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
    const url = urlData.publicUrl
    await supabase.from('deals').update({ photo_url: url }).eq('business_name', deal.business_name)
    setPhotoUploading(false); await loadData()
  }

  async function removePhoto(deal: Deal) {
    await supabase.from('deals').update({ photo_url: null }).eq('business_name', deal.business_name)
    await loadData()
  }

  function openScheduleEditor(deal: Deal) {
    setEditingSchedule(deal)
    if (deal.schedule) {
      setSchedDays(deal.schedule.days)
      setSchedStart(deal.schedule.start)
      setSchedEnd(deal.schedule.end)
    } else {
      setSchedDays([0, 1, 2, 3, 4, 5, 6])
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

  async function toggleBusiness(biz: Business) {
    setTogglingBiz(biz.id)
    const disabling = !biz.admin_disabled
    const accountId = await ensureBusinessAccount(biz)
    await supabase.from('business_accounts').update({ admin_disabled: disabling }).eq('id', accountId)
    if (disabling) { await supabase.from('deals').update({ admin_disabled: true, active: false }).eq('business_name', biz.business_name) }
    else { await supabase.from('deals').update({ admin_disabled: false }).eq('business_name', biz.business_name) }
    await loadData(); setTogglingBiz(null)
  }

  async function ensureBusinessAccount(biz: Business): Promise<string> {
    if (biz.source !== 'approved_application' && !biz.id.startsWith('application:')) return biz.id

    const { data: existingAccount } = await supabase
      .from('business_accounts')
      .select('id')
      .eq('business_name', biz.business_name)
      .maybeSingle()

    if (existingAccount?.id) return existingAccount.id

    const { data: insertedAccount, error: insertError } = await supabase
      .from('business_accounts')
      .insert({
        business_name: biz.business_name,
        category: normalizeCategory(biz.category),
        address: biz.address,
        deal_offer: biz.deal_offer || null,
        contact_email: biz.contact_email.toLowerCase().trim(),
        active: true,
        admin_disabled: false,
      })
      .select('id')
      .single()

    if (insertError) throw insertError
    return insertedAccount.id
  }

  function startBusinessEdit(biz: Business) {
    const primaryDeal = deals.find((deal) => deal.business_name === biz.business_name && deal.deal_description === biz.deal_offer)
      || deals.find((deal) => deal.business_name === biz.business_name)
    setEditingBusiness(biz.id)
    setBusinessEditFields({
      business_name: biz.business_name,
      category: normalizeCategory(biz.category),
      address: biz.address,
      contact_email: biz.contact_email,
      deal_offer: biz.deal_offer || '',
      deal_description: primaryDeal?.deal_description || biz.deal_offer || '',
    })
  }

  async function saveBusinessEdit(biz: Business) {
    if (!businessEditFields.business_name || !businessEditFields.category || !businessEditFields.address || !businessEditFields.contact_email) return

    setSavingBusinessEdit(true)
    const oldBusinessName = biz.business_name
    const accountId = await ensureBusinessAccount(biz)
    const newBusinessName = businessEditFields.business_name.trim()
    const normalizedCategory = normalizeCategory(businessEditFields.category)
    const normalizedEmail = businessEditFields.contact_email.trim().toLowerCase()
    const trimmedAddress = businessEditFields.address.trim()
    const trimmedDealOffer = businessEditFields.deal_offer.trim()
    const trimmedDealDescription = businessEditFields.deal_description.trim()
    const primaryDeal = deals.find((deal) => deal.business_name === oldBusinessName && deal.deal_description === (biz.deal_offer || ''))
      || deals.find((deal) => deal.business_name === oldBusinessName)

    await supabase.from('business_accounts').update({
      business_name: newBusinessName,
      category: normalizedCategory,
      address: trimmedAddress,
      contact_email: normalizedEmail,
      deal_offer: trimmedDealOffer || null,
    }).eq('id', accountId)

    await supabase.from('deals').update({
      business_name: newBusinessName,
      category: normalizedCategory,
      address: trimmedAddress,
    }).eq('business_name', oldBusinessName)

    if (primaryDeal?.id && trimmedDealDescription) {
      await supabase.from('deals').update({
        deal_description: trimmedDealDescription,
      }).eq('id', primaryDeal.id)
    }

    await supabase.from('redemptions').update({
      business_name: newBusinessName,
    }).eq('business_name', oldBusinessName)

    await supabase.from('business_applications').update({
      business_name: newBusinessName,
      category: normalizedCategory,
      address: trimmedAddress,
      contact_email: normalizedEmail,
      deal_offer: trimmedDealOffer || null,
    }).eq('business_name', oldBusinessName)

    setEditingBusiness(null)
    setSavingBusinessEdit(false)
    await loadData()
  }

  async function deleteBusiness(biz: Business) {
    setDeletingBusiness(biz.id)
    const businessName = biz.business_name
    await supabase.from('deals').delete().eq('business_name', businessName)
    await supabase.from('business_accounts').delete().eq('business_name', businessName)
    await supabase.from('business_applications').update({ status: 'rejected' }).eq('business_name', businessName)
    if (dealBusinessFilter === businessName) setDealBusinessFilter('all')
    setConfirmBusinessDelete(null)
    setEditingBusiness(null)
    await loadData()
    setDeletingBusiness(null)
  }

  function updateDirectField(field: keyof DirectBusinessForm, value: string) {
    setDirectForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateExistingDealField(field: keyof ExistingBusinessDealForm, value: string) {
    setExistingDealForm((prev) => ({ ...prev, [field]: value }))
  }

  async function addBusinessDirectly() {
    if (!directForm.business_name || !directForm.category || !directForm.address || !directForm.deal_offer || !directForm.contact_email) {
      setDirectError('Business name, category, address, deal, and contact email are required.')
      return
    }

    setAddingBusiness(true)
    setDirectError('')

    try {
      const normalizedCategory = normalizeCategory(directForm.category)
      const normalizedEmail = directForm.contact_email.trim().toLowerCase()
      const trimmedBusinessName = directForm.business_name.trim()
      const trimmedAddress = directForm.address.trim()
      const trimmedDealOffer = directForm.deal_offer.trim()
      const trimmedDealDetails = directForm.deal_details.trim()

      const { data: existingDeal } = await supabase
        .from('deals')
        .select('id')
        .eq('business_name', trimmedBusinessName)
        .eq('deal_description', trimmedDealOffer)
        .maybeSingle()

      if (existingDeal) {
        setDirectError('That business and deal combination already exists.')
        setAddingBusiness(false)
        return
      }

      const { data: existingAccount } = await supabase
        .from('business_accounts')
        .select('id, photo_url')
        .eq('business_name', trimmedBusinessName)
        .maybeSingle()

      const photoUrl = existingAccount?.photo_url || null

      const businessPayload = {
        business_name: trimmedBusinessName,
        category: normalizedCategory,
        address: trimmedAddress,
        deal_offer: trimmedDealOffer,
        contact_email: normalizedEmail,
        active: true,
        admin_disabled: false,
      }

      const businessError = existingAccount?.id
        ? (await supabase.from('business_accounts').update(businessPayload).eq('id', existingAccount.id)).error
        : (await supabase.from('business_accounts').insert(businessPayload)).error

      if (businessError) throw businessError

      const { error: dealError } = await supabase.from('deals').insert({
        business_name: trimmedBusinessName,
        deal_description: trimmedDealOffer,
        deal_details: trimmedDealDetails || null,
        category: normalizedCategory,
        emoji: '🎟️',
        address: trimmedAddress,
        active: true,
        admin_disabled: false,
        photo_url: photoUrl,
      })

      if (dealError) throw dealError

      setDirectForm({
        business_name: '',
        category: '',
        address: '',
        deal_offer: '',
        deal_details: '',
        contact_name: '',
        contact_email: '',
        phone: '',
      })
      await loadData()
      setTab('businesses')
    } catch (error) {
      console.error('direct add business error:', error)
      setDirectError(error instanceof Error ? error.message : 'Could not add this business right now. Try again.')
    } finally {
      setAddingBusiness(false)
    }
  }

  async function addDealForExistingBusiness() {
    if (!existingDealForm.business_id || !existingDealForm.deal_description.trim()) {
      setExistingDealError('Choose a business and enter the deal description.')
      return
    }

    setAddingExistingDeal(true)
    setExistingDealError('')

    try {
      const business = businesses.find((biz) => biz.id === existingDealForm.business_id)
      if (!business) {
        setExistingDealError('Choose a valid business.')
        setAddingExistingDeal(false)
        return
      }

      const trimmedDescription = existingDealForm.deal_description.trim()
      const trimmedDetails = existingDealForm.deal_details.trim()

      const { data: existingDeal } = await supabase
        .from('deals')
        .select('id')
        .eq('business_name', business.business_name)
        .eq('deal_description', trimmedDescription)
        .maybeSingle()

      if (existingDeal) {
        setExistingDealError('That deal already exists for this business.')
        setAddingExistingDeal(false)
        return
      }

      const { error: insertError } = await supabase.from('deals').insert({
        business_name: business.business_name,
        deal_description: trimmedDescription,
        deal_details: trimmedDetails || null,
        category: normalizeCategory(business.category),
        emoji: '🎟️',
        address: business.address,
        active: true,
        admin_disabled: false,
        photo_url: business.photo_url || null,
      })

      if (insertError) throw insertError

      setExistingDealForm({
        business_id: '',
        deal_description: '',
        deal_details: '',
      })
      await loadData()
    } catch (error) {
      console.error('add existing business deal error:', error)
      setExistingDealError(error instanceof Error ? error.message : 'Could not add this deal right now. Try again.')
    } finally {
      setAddingExistingDeal(false)
    }
  }

  function login() {
    if (password === 'perkpassadmin') { setAuthed(true); loadData() } else setError('Wrong password')
  }

  const pending = applications.filter(a => a.status === 'pending')
  const activeBusinesses = businesses.filter(b => !b.admin_disabled).length
  const disabledBusinesses = businesses.filter(b => b.admin_disabled).length
  const dealCountsByBusiness = deals.reduce<Record<string, number>>((acc, deal) => {
    acc[deal.business_name] = (acc[deal.business_name] || 0) + 1
    return acc
  }, {})
  const visibleDeals = dealBusinessFilter === 'all'
    ? deals
    : deals.filter((deal) => deal.business_name === dealBusinessFilter)
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
              {[{ label: 'View applications', desc: pending.length + ' pending review', action: () => setTab('applications') }, { label: 'Manage deals', desc: stats.deals + ' live deals', action: () => setTab('deals') }, { label: 'Manage businesses', desc: activeBusinesses + ' active Â· ' + disabledBusinesses + ' disabled', action: () => setTab('businesses') }, { label: 'Business portal', desc: 'See what businesses see', action: () => window.open('/business/dashboard', '_blank') }].map(a => (
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
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-4)', marginBottom: '20px' }}>Archive hides a deal but keeps it available for admin re-enable later. Delete forever removes it permanently. Featured is handled one deal per business.</p>
            <div style={{ background: 'var(--bg-2)', borderRadius: '12px', padding: '18px', border: '1px solid var(--border-2)', marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Add deal for existing business
              </div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-4)', marginBottom: '14px' }}>
                Publish a new deal directly under a business that is already on PerkPass.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Business</label>
                  <select style={INPUT_STYLE} value={existingDealForm.business_id} onChange={e => updateExistingDealField('business_id', e.target.value)}>
                    <option value="">Select business</option>
                    {businesses
                      .filter((biz) => !biz.admin_disabled)
                      .map((biz) => (
                        <option key={biz.id} value={biz.id}>
                          {biz.business_name}
                        </option>
                      ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Deal Description</label>
                  <input style={INPUT_STYLE} value={existingDealForm.deal_description} onChange={e => updateExistingDealField('deal_description', e.target.value)} placeholder="$10 off any service on Tuesdays" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Deal Details</label>
                  <textarea style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '78px' }} value={existingDealForm.deal_details} onChange={e => updateExistingDealField('deal_details', e.target.value)} placeholder="Optional fine print, restrictions, or redemption notes" />
                </div>
              </div>
              {existingDealError && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '10px' }}>{existingDealError}</p>}
              <button onClick={addDealForExistingBusiness} disabled={addingExistingDeal} className="btn btn-primary" style={{ fontSize: '14px', padding: '12px 18px' }}>
                {addingExistingDeal ? 'Adding...' : 'Add deal'}
              </button>
            </div>
            <div style={{ background: 'var(--bg-2)', borderRadius: '12px', padding: '16px 18px', border: '1px solid var(--border-2)', marginBottom: '18px', display: 'flex', alignItems: 'end', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '220px', flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Filter by business</label>
                <select style={INPUT_STYLE} value={dealBusinessFilter} onChange={e => setDealBusinessFilter(e.target.value)}>
                  <option value="all">All businesses</option>
                  {businesses.map((biz) => (
                    <option key={biz.id} value={biz.business_name}>
                      {biz.business_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-4)', paddingBottom: '8px' }}>
                Showing {visibleDeals.length} {visibleDeals.length === 1 ? 'deal' : 'deals'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {visibleDeals.map((deal: Deal) => (
                <div key={deal.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', opacity: deal.admin_disabled && editingDeal !== deal.id ? 0.5 : 1 }}>
                  {confirmDelete === deal.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--red-lt)', borderRadius: '8px', padding: '14px 16px' }}>
                      <div style={{ flex: 1 }}><div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase' }}>Archive or delete?</div><div style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 500, opacity: 0.8, marginTop: '2px' }}>Archive keeps the deal in admin. Delete forever cannot be undone.</div></div>
                      <button onClick={() => archiveDeal(deal.id)} disabled={deletingDeal === deal.id} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'var(--ink)', color: 'var(--bg)', flexShrink: 0 }}>{deletingDeal === deal.id ? '...' : 'Archive'}</button>
                      <button onClick={() => deleteDeal(deal.id)} disabled={deletingDeal === deal.id} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'var(--red)', color: '#fff', flexShrink: 0 }}>{deletingDeal === deal.id ? '...' : 'Delete forever'}</button>
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
                          <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Deal Details</label>
                          <textarea style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '78px' }} value={editFields.deal_details} onChange={e => setEditFields(f => ({ ...f, deal_details: e.target.value }))} placeholder="Optional fine print, restrictions, or redemption notes" />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Category</label>
                          <select style={INPUT_STYLE} value={editFields.category} onChange={e => setEditFields(f => ({ ...f, category: e.target.value }))}>
                            {CATEGORY_OPTIONS.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
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
                          <p style={{ fontSize: '11px', color: 'var(--ink-4)', fontWeight: 500, marginTop: '4px' }}>JPG, PNG or WebP Â· applies to all deals for this business</p>
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
                          {deal.admin_disabled && <span style={{ ...LABEL, fontSize: '10px', background: 'var(--red-lt)', color: 'var(--red)', padding: '2px 8px', borderRadius: '3px' }}>Archived</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green-dk)' }}>{deal.deal_description}</div>
                          {deal.featured && <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '2px 8px', borderRadius: '3px' }}>Featured</span>}
                        </div>
                        {deal.deal_details && (
                          <div style={{ fontSize: '12px', color: 'var(--ink-3)', fontWeight: 500, marginTop: '3px', lineHeight: 1.45 }}>{deal.deal_details}</div>
                        )}
                        <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500, marginTop: '2px' }}>{deal.category} Â· {deal.address}</div>
                        {deal.schedule && (
                          <div style={{ fontSize: '11px', color: 'var(--ink-4)', fontWeight: 500, marginTop: '3px' }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].filter((_, i) => deal.schedule!.days.includes(i)).join(', ')} {deal.schedule.start}-{deal.schedule.end}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: deal.active && !deal.admin_disabled ? 'var(--green)' : 'var(--ink-4)' }} />
                        <button onClick={() => startEdit(deal)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                        <span style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>
                        <button onClick={() => openScheduleEditor(deal)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--green-dk)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          {deal.schedule ? 'Edit hours' : 'Set hours'}
                        </button>
                        <span style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>
                        <button onClick={() => toggleFeatured(deal)} disabled={deal.admin_disabled || !deal.active} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: deal.featured ? 'var(--green-dk)' : deal.admin_disabled || !deal.active ? 'var(--border)' : 'var(--ink-4)', background: 'none', border: 'none', cursor: deal.admin_disabled || !deal.active ? 'not-allowed' : 'pointer' }}>
                          {deal.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <span style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>
                        <button onClick={() => adminToggleDeal(deal)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: deal.admin_disabled ? 'var(--green-dk)' : 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>{deal.admin_disabled ? 'Re-enable' : 'Disable'}</button>
                        <span style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>
                        <button onClick={() => { setConfirmDelete(deal.id); setEditingDeal(null) }} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}>Archive/Delete</button>
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
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-4)', marginBottom: '20px' }}>Approved businesses all live here. Disable hides a business and pauses its deals. Delete removes the business listing and its deals.</p>
            <div style={{ background: 'var(--bg-2)', borderRadius: '12px', padding: '18px', border: '1px solid var(--border-2)', marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Add business directly
              </div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-4)', marginBottom: '14px' }}>
                Use this when a business already gave you permission and you want to list them without waiting for a public application.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Business Name</label>
                  <input style={INPUT_STYLE} value={directForm.business_name} onChange={e => updateDirectField('business_name', e.target.value)} placeholder="La Colombe" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Category</label>
                  <select style={INPUT_STYLE} value={directForm.category} onChange={e => updateDirectField('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Address</label>
                  <input style={INPUT_STYLE} value={directForm.address} onChange={e => updateDirectField('address', e.target.value)} placeholder="1335 Frankford Ave, Philadelphia, PA 19125" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Deal Offer</label>
                  <input style={INPUT_STYLE} value={directForm.deal_offer} onChange={e => updateDirectField('deal_offer', e.target.value)} placeholder="$2 off any espresso drink before 11am" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Deal Details</label>
                  <textarea style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '78px' }} value={directForm.deal_details} onChange={e => updateDirectField('deal_details', e.target.value)} placeholder="Optional fine print, restrictions, or redemption notes" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Contact Name</label>
                  <input style={INPUT_STYLE} value={directForm.contact_name} onChange={e => updateDirectField('contact_name', e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Contact Email</label>
                  <input style={INPUT_STYLE} value={directForm.contact_email} onChange={e => updateDirectField('contact_email', e.target.value)} placeholder="partner@business.com" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Phone</label>
                  <input style={INPUT_STYLE} value={directForm.phone} onChange={e => updateDirectField('phone', e.target.value)} placeholder="Optional" />
                </div>
              </div>
              {directError && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '10px' }}>{directError}</p>}
              <button onClick={addBusinessDirectly} disabled={addingBusiness} className="btn btn-primary" style={{ fontSize: '14px', padding: '12px 18px' }}>
                {addingBusiness ? 'Adding...' : 'Add business + first deal'}
              </button>
            </div>
            {businesses.length === 0 ? (
              <div style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '32px', textAlign: 'center', border: '1px solid var(--border-2)' }}><p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-3)' }}>No businesses yet.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {businesses.map((biz: Business) => (
                  <div key={biz.id} style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '18px 20px', border: '1px solid ' + (biz.admin_disabled ? 'var(--red)' : 'var(--border-2)'), opacity: biz.admin_disabled && editingBusiness !== biz.id ? 0.6 : 1 }}>
                    {confirmBusinessDelete === biz.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--red-lt)', borderRadius: '8px', padding: '14px 16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase' }}>Delete {biz.business_name}?</div>
                          <div style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 500, opacity: 0.8, marginTop: '2px' }}>This removes the business listing and deletes its deals. Redemption history is kept.</div>
                        </div>
                        <button onClick={() => deleteBusiness(biz)} disabled={deletingBusiness === biz.id} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'var(--red)', color: '#fff', flexShrink: 0 }}>{deletingBusiness === biz.id ? '...' : 'Confirm'}</button>
                        <button onClick={() => setConfirmBusinessDelete(null)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--red)', cursor: 'pointer', background: 'none', color: 'var(--red)', flexShrink: 0 }}>Cancel</button>
                      </div>
                    ) : editingBusiness === biz.id ? (
                      <div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                          Edit business
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Business Name</label>
                            <input style={INPUT_STYLE} value={businessEditFields.business_name} onChange={e => setBusinessEditFields(f => ({ ...f, business_name: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Category</label>
                            <select style={INPUT_STYLE} value={businessEditFields.category} onChange={e => setBusinessEditFields(f => ({ ...f, category: e.target.value }))}>
                              {CATEGORY_OPTIONS.map((category) => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Contact Email</label>
                            <input style={INPUT_STYLE} value={businessEditFields.contact_email} onChange={e => setBusinessEditFields(f => ({ ...f, contact_email: e.target.value }))} />
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Address</label>
                            <input style={INPUT_STYLE} value={businessEditFields.address} onChange={e => setBusinessEditFields(f => ({ ...f, address: e.target.value }))} />
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Primary Deal Offer</label>
                            <input style={INPUT_STYLE} value={businessEditFields.deal_offer} onChange={e => setBusinessEditFields(f => ({ ...f, deal_offer: e.target.value }))} placeholder="Optional business-level offer summary" />
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '4px', ...LABEL }}>Primary Deal Description</label>
                            <input style={INPUT_STYLE} value={businessEditFields.deal_description} onChange={e => setBusinessEditFields(f => ({ ...f, deal_description: e.target.value }))} placeholder="The live deal members will see first" />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button onClick={() => saveBusinessEdit(biz)} disabled={savingBusinessEdit} className="btn btn-primary" style={{ fontSize: '14px', padding: '10px 18px' }}>
                            {savingBusinessEdit ? 'Saving...' : 'Save changes'}
                          </button>
                          <button onClick={() => setEditingBusiness(null)} className="btn btn-outline" style={{ fontSize: '14px', padding: '10px 18px' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>{biz.business_name}</div>
                            {biz.admin_disabled && <span style={{ ...LABEL, fontSize: '10px', background: 'var(--red-lt)', color: 'var(--red)', padding: '2px 8px', borderRadius: '3px' }}>Disabled</span>}
                            {biz.source === 'approved_application' && <span style={{ ...LABEL, fontSize: '10px', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '2px 8px', borderRadius: '3px' }}>Approved app</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500 }}>{biz.category} Â· {biz.address}</div>
                          <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500 }}>{biz.contact_email}</div>
                          <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 600, marginTop: '4px' }}>{dealCountsByBusiness[biz.business_name] || 0} live deals</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <button onClick={() => { setDealBusinessFilter(biz.business_name); setTab('deals') }} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--green-dk)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Manage deals
                          </button>
                          <span style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>
                          <button onClick={() => startBusinessEdit(biz)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Edit
                          </button>
                          <span style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>
                          <button onClick={() => toggleBusiness(biz)} disabled={togglingBiz === biz.id} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 18px', borderRadius: '6px', border: 'none', cursor: 'pointer', flexShrink: 0, background: biz.admin_disabled ? 'var(--green-lt)' : 'var(--red-lt)', color: biz.admin_disabled ? 'var(--green-dk)' : 'var(--red)' }}>
                            {togglingBiz === biz.id ? '...' : biz.admin_disabled ? 'Re-enable' : 'Disable'}
                          </button>
                          <button onClick={() => { setConfirmBusinessDelete(biz.id); setEditingBusiness(null) }} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editingSchedule && (() => {
        const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const TIMES: string[] = []
        for (let h = 0; h < 24; h++) {
          TIMES.push(String(h).padStart(2, '0') + ':00')
          TIMES.push(String(h).padStart(2, '0') + ':30')
        }
        function fmt(t: string) {
          const [hh, mm] = t.split(':').map(Number)
          const ampm = hh >= 12 ? 'PM' : 'AM'
          return (hh % 12 || 12) + ':' + String(mm).padStart(2, '0') + ' ' + ampm
        }
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '28px 24px', width: '100%', maxWidth: '420px', border: '2px solid var(--ink)' }}>
              <h2 className="display" style={{ fontSize: '28px', marginBottom: '4px' }}>Set Hours</h2>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '24px' }}>{editingSchedule.deal_description}</p>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>Active days</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {DAY_LABELS.map((d, i) => (
                    <button key={i} onClick={() => setSchedDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort())} style={{ flex: 1, padding: '10px 0', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, background: schedDays.includes(i) ? 'var(--forest)' : 'var(--bg-2)', color: schedDays.includes(i) ? 'var(--green)' : 'var(--ink-4)', outline: schedDays.includes(i) ? '2px solid var(--green)' : '1px solid var(--border)' }}>
                      {d.slice(0, 1)}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {[['Weekdays', [1, 2, 3, 4, 5]], ['Weekends', [0, 6]], ['Every day', [0, 1, 2, 3, 4, 5, 6]]].map(([label, days]) => (
                    <button key={label as string} onClick={() => setSchedDays(days as number[])} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-2)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', cursor: 'pointer' }}>
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>
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
              <div style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '4px' }}>Members will see</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  {schedDays.length === 0
                    ? 'No days selected'
                    : schedDays.length === 7
                      ? 'Every day, ' + fmt(schedStart) + '-' + fmt(schedEnd)
                      : DAY_LABELS.filter((_, i) => schedDays.includes(i)).join(', ') + ', ' + fmt(schedStart) + '-' + fmt(schedEnd)}
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
    </main>
  )
}
