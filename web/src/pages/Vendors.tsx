import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'
import { deleteVendor, listHomes, listVendors, newId, saveHome, saveVendor } from '../lib/db'
import type { Vendor } from '../lib/types'
import './pages.css'
import './Vendors.css'

const CATEGORIES = ['Plumbing', 'HVAC', 'Electrical', 'Landscaping', 'Handyman', 'Other']
const blank = { category: 'Plumbing', company: '', phone: '', website: '' }

const normalizeUrl = (u: string) => (u.trim() && !/^https?:\/\//i.test(u.trim()) ? `https://${u.trim()}` : u.trim())

export default function Vendors() {
  const { user } = useAuth()
  const [vendors, setVendors] = useState<Vendor[] | null>(null)
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLElement>(null)

  useEffect(() => { if (user) listVendors(user.uid).then(setVendors) }, [user])
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value })

  const reset = () => { setForm(blank); setEditingId(null); setErr('') }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!form.company.trim()) { setErr('Please add the company name.'); return }
    setBusy(true); setErr('')
    try {
      const existing = vendors?.find((v) => v.id === editingId)
      const v: Vendor = {
        id: existing?.id ?? newId('vendors'), agentId: user.uid,
        category: form.category, company: form.company.trim(), phone: form.phone.trim(), website: normalizeUrl(form.website),
        addToNewHomes: existing?.addToNewHomes ?? false, createdAt: existing?.createdAt ?? Date.now(),
      }
      await saveVendor(v)
      setVendors((cur) => (existing ? (cur ?? []).map((x) => (x.id === v.id ? v : x)) : [...(cur ?? []), v]))
      reset()
    } catch (x) { setErr(x instanceof Error ? x.message : 'Could not save') } finally { setBusy(false) }
  }

  const toggle = async (v: Vendor) => {
    const next = { ...v, addToNewHomes: !v.addToNewHomes }
    setVendors((cur) => (cur ?? []).map((x) => (x.id === v.id ? next : x)))
    await saveVendor(next)
  }

  const edit = (v: Vendor) => {
    setEditingId(v.id); setErr('')
    setForm({ category: v.category, company: v.company, phone: v.phone, website: v.website })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const remove = async () => {
    const v = vendors?.find((x) => x.id === editingId)
    if (!v || !window.confirm(`Delete ${v.company}? It will also be removed from homes you’ve set up.`)) return
    await deleteVendor(v.id)
    if (user) for (const h of await listHomes(user.uid)) if (h.vendorIds.includes(v.id)) await saveHome({ ...h, vendorIds: h.vendorIds.filter((x) => x !== v.id) })
    setVendors((cur) => (cur ?? []).filter((x) => x.id !== v.id))
    reset()
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div>
        <h1 className="page-title">My vendors</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>Your go-to pros. Save them once, then add them to any home.</p>
      </div>

      <section className="card vendor-form" ref={formRef}>
        <h2 className="section-title" style={{ fontSize: 17 }}>{editingId ? 'Edit vendor' : 'Add a vendor'}</h2>
        <form onSubmit={save} className="vendor-fields">
          <label style={{ flex: '1 1 160px' }}>Category
            <select className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ flex: '2 1 220px' }}>Company name<input className="input" value={form.company} onChange={set('company')} placeholder="Company name" /></label>
          <label style={{ flex: '1 1 170px' }}>Phone<input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="Phone" /></label>
          <label style={{ flex: '1 1 200px' }}>Website<input className="input" value={form.website} onChange={set('website')} placeholder="Optional" /></label>
          <div className="vendor-actions">
            <button className="btn btn-primary" disabled={busy}>{editingId ? 'Save changes' : 'Save vendor'}</button>
            {editingId && <button type="button" className="btn btn-ghost" onClick={reset}>Cancel</button>}
            {editingId && <button type="button" className="btn btn-ghost danger" onClick={remove}>Delete</button>}
          </div>
        </form>
        {err && <p role="alert" style={{ color: '#B3261E', fontWeight: 600, margin: 0 }}>{err}</p>}
      </section>

      <div className="table-card">
        <div style={{ minWidth: 640 }}>
          <div className="vrow thead"><span>Category</span><span>Company</span><span>Phone</span><span>Add to new homes</span><span /></div>
          {vendors === null ? <p className="empty">Loading…</p> : vendors.length === 0 ? (
            <p className="empty">No vendors yet. Add your plumber, HVAC pro or handyman above.</p>
          ) : vendors.map((v) => (
            <div className="vrow" key={v.id}>
              <span><span className="pill pill-active">{v.category}</span></span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {v.website ? <a href={v.website} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{v.company}</a> : v.company}
              </span>
              <span className="muted" style={{ fontSize: 14 }}>{v.phone || '—'}</span>
              <span>
                <button role="switch" aria-checked={v.addToNewHomes} aria-label={`Add ${v.company} to new homes`} className="switch-btn" onClick={() => toggle(v)}>
                  <span className={`track${v.addToNewHomes ? ' on' : ''}`}><span /></span>
                </button>
              </span>
              <button className="edit-btn" aria-label={`Edit ${v.company}`} onClick={() => edit(v)}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" fill="none" stroke="#0E4D5C" strokeWidth="2" strokeLinejoin="round" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
