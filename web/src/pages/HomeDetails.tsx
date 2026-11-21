import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { addDocument, getHome, listDocuments, listVendors, removeDocument, saveHome, setDocumentFolder } from '../lib/db'
import { fileUrl } from '../lib/storage'
import { FOLDER_LABELS, formatDate, type DocFolder, type Home, type HomeDocument, type Vendor } from '../lib/types'
import './pages.css'

const FIELDS: { key: keyof Home['details']; label: string; ph: string }[] = [
  { key: 'furnaceYear', label: 'Furnace · year installed', ph: 'e.g. 2018' },
  { key: 'waterHeaterYear', label: 'Water heater · year installed', ph: 'e.g. 2020' },
  { key: 'roofYear', label: 'Roof · year installed', ph: 'e.g. 2015' },
  { key: 'wifi', label: 'Wi-Fi network', ph: 'Network name' },
  { key: 'waterShutoff', label: 'Water shutoff location', ph: 'e.g. Garage, left wall' },
  { key: 'paintColors', label: 'Paint colors', ph: 'Color names' },
]
const AGENT_FOLDERS: DocFolder[] = ['closing', 'inspection', 'warranties']

export default function HomeDetails() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [home, setHome] = useState<Home | null | undefined>(undefined)
  const [docs, setDocs] = useState<HomeDocument[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [saved, setSaved] = useState('')
  const [over, setOver] = useState(false)
  const [err, setErr] = useState('')
  const [extra, setExtra] = useState({ label: '', value: '' })
  const [addingDetail, setAddingDetail] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const timer = useRef<number>(undefined)

  useEffect(() => {
    if (!user) return
    getHome(id).then((h) => setHome(h && h.agentId === user.uid ? h : null))
    listDocuments(id).then(setDocs).catch(() => {})
    listVendors(user.uid).then(setVendors)
  }, [id, user])

  // Debounced autosave of any change to the home.
  const update = useCallback((fn: (h: Home) => Home) => {
    setHome((cur) => {
      if (!cur) return cur
      const next = fn(cur)
      setSaved('Saving…')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => saveHome(next).then(() => setSaved('All changes saved')).catch(() => setSaved('Could not save')), 600)
      return next
    })
  }, [])

  const upload = async (files: FileList | File[]) => {
    setErr('')
    try {
      for (const f of Array.from(files)) {
        if (!/^(application\/pdf|image\/)/.test(f.type)) { setErr('Only PDFs and photos can be added.'); continue }
        const d = await addDocument(id, f, 'closing')
        setDocs((x) => [...x, d])
      }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed') }
  }

  const open = async (d: HomeDocument) => { const u = await fileUrl(d.storagePath); if (u) window.open(u, '_blank') }

  if (home === undefined) return <p>Loading…</p>
  if (home === null) return <div><Link to="/homes" className="back">‹ Homes</Link><p>We couldn’t find that home.</p></div>

  const checklist = [
    { label: 'Home & buyer', done: Boolean(home.address && home.buyer.names) },
    { label: 'Documents', done: docs.length > 0 },
    { label: 'Home details', done: Object.entries(home.details).some(([k, v]) => k !== 'extra' && v) || home.details.extra.length > 0 },
    { label: 'Reminders', done: home.reminders.some((r) => r.enabled) },
    { label: 'Vendors', done: home.vendorIds.length > 0 },
  ]
  const ready = checklist[0].done

  return (
    <div className="stack" style={{ gap: 22 }}>
      <Link to="/homes" className="back">‹ Homes</Link>
      <div className="head-row">
        <div>
          <h1 className="page-title" style={{ fontSize: 34 }}>{home.address}</h1>
          <p className="muted">For {home.buyer.names || 'your buyer'} · Closing {formatDate(home.closingDate)}</p>
        </div>
        <div className="row-gap" style={{ alignItems: 'center' }}>
          <Link to={`/homes/${id}/edit`} className="btn btn-ghost" style={{ minHeight: 44 }}>Edit home &amp; buyer</Link>
          <span className={`pill pill-${home.status}`} style={{ height: 30 }}>{home.status[0].toUpperCase() + home.status.slice(1)}</span>
        </div>
      </div>

      <div className="detail-cols">
        <div className="detail-main">
          <section className="card sec" style={{ gap: 14 }}>
            <div><h2 className="section-title">Documents</h2><p className="sec-sub">Drop in closing docs, the inspection and any warranties.</p></div>
            <input ref={input} type="file" multiple accept="application/pdf,image/*" hidden onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = '' }} />
            <button type="button" className={`dropzone${over ? ' over' : ''}`}
              onClick={() => input.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files) }}>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" fill="none" stroke="#0E4D5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Drag files here or browse<small>PDFs and photos</small>
            </button>
            {err && <p role="alert" style={{ color: '#B3261E', fontWeight: 600, margin: 0 }}>{err}</p>}
            <div>
              {docs.filter((d) => d.uploadedBy === 'agent').map((d) => (
                <div className="doc-row" key={d.id}>
                  <span className="doc-badge">{d.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMG'}</span>
                  <button className="doc-name" onClick={() => open(d)}>{d.name}</button>
                  <label className="doc-folder">Folder
                    <select value={d.folder} onChange={(e) => {
                      const folder = e.target.value as DocFolder
                      setDocs((x) => x.map((y) => (y.id === d.id ? { ...y, folder } : y)))
                      setDocumentFolder(id, d.id, folder)
                    }}>{AGENT_FOLDERS.map((f) => <option key={f} value={f}>{FOLDER_LABELS[f]}</option>)}</select>
                  </label>
                  <button className="icon-btn" aria-label={`Remove ${d.name}`} onClick={() => { setDocs((x) => x.filter((y) => y.id !== d.id)); removeDocument(id, d) }}>Remove</button>
                </div>
              ))}
            </div>
          </section>

          <section className="card sec" style={{ gap: 14 }}>
            <div><h2 className="section-title">Home details</h2><p className="sec-sub">Shows on the buyer’s My Home page. Skip anything you don’t know.</p></div>
            <div className="fields">
              {FIELDS.map((fl) => (
                <label key={fl.key} style={{ flexBasis: 220 }}>{fl.label}
                  <input className="input" value={home.details[fl.key] as string} placeholder={fl.ph}
                    onChange={(e) => update((h) => ({ ...h, details: { ...h.details, [fl.key]: e.target.value } }))} />
                </label>
              ))}
              {home.details.extra.map((x, i) => (
                <label key={i} style={{ flexBasis: 220 }}>{x.label}
                  <span style={{ display: 'flex', gap: 6 }}>
                    <input className="input" value={x.value} onChange={(e) => update((h) => ({ ...h, details: { ...h.details, extra: h.details.extra.map((y, j) => (j === i ? { ...y, value: e.target.value } : y)) } }))} />
                    <button type="button" className="icon-btn" aria-label={`Remove ${x.label}`} onClick={() => update((h) => ({ ...h, details: { ...h.details, extra: h.details.extra.filter((_, j) => j !== i) } }))}>✕</button>
                  </span>
                </label>
              ))}
            </div>
            {addingDetail ? (
              <div className="add-detail">
                <label className="field" style={{ flexBasis: 180 }}>Label<input className="input" value={extra.label} onChange={(e) => setExtra({ ...extra, label: e.target.value })} placeholder="e.g. Trash day" /></label>
                <label className="field" style={{ flexBasis: 180 }}>Value<input className="input" value={extra.value} onChange={(e) => setExtra({ ...extra, value: e.target.value })} placeholder="e.g. Tuesday" /></label>
                <button className="btn btn-secondary" disabled={!extra.label.trim()} onClick={() => {
                  update((h) => ({ ...h, details: { ...h.details, extra: [...h.details.extra, { label: extra.label.trim(), value: extra.value.trim() }] } }))
                  setExtra({ label: '', value: '' }); setAddingDetail(false)
                }}>Add</button>
              </div>
            ) : (
              <button className="btn btn-secondary" style={{ alignSelf: 'flex-start', minHeight: 44, fontSize: 13 }} onClick={() => setAddingDetail(true)}>+ Add a detail</button>
            )}
          </section>

          <section className="card sec" style={{ gap: 10 }}>
            <div><h2 className="section-title">Starter reminders</h2><p className="sec-sub">The buyer gets these on a schedule. They can add their own.</p></div>
            {home.reminders.map((r) => (
              <button key={r.id} role="switch" aria-checked={r.enabled} className="switch-row"
                onClick={() => update((h) => ({ ...h, reminders: h.reminders.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)) }))}>
                <span className="t">{r.name}<small>{r.schedule}</small></span>
                <span className={`track${r.enabled ? ' on' : ''}`}><span /></span>
              </button>
            ))}
          </section>

          <section className="card sec" style={{ gap: 12 }}>
            <div className="head-row" style={{ gap: 8 }}>
              <div><h2 className="section-title">Vendors for this home</h2><p className="sec-sub">Pick from your saved vendors.</p></div>
              <Link to="/vendors" style={{ fontSize: 13, fontWeight: 700 }}>Manage vendors</Link>
            </div>
            {vendors.length === 0 ? <p className="sec-sub">You haven’t saved any vendors yet. Add some under My vendors.</p> : (
              <div className="vchips">
                {vendors.map((v) => {
                  const on = home.vendorIds.includes(v.id)
                  return (
                    <button key={v.id} className="vchip" aria-pressed={on}
                      onClick={() => update((h) => ({ ...h, vendorIds: on ? h.vendorIds.filter((x) => x !== v.id) : [...h.vendorIds, v.id] }))}>
                      <svg width="12" height="12" viewBox="4 4 16 16" aria-hidden="true" className="vchip-icon">
                        {on ? <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
                      </svg>
                      <span>{v.category}{v.company ? ` · ${v.company}` : ''}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
          <p className="saved" aria-live="polite">{saved}</p>
        </div>

        <aside className="checklist">
          <h2>Ready to send?</h2>
          {checklist.map((c) => (
            <div className="check-item" key={c.label}>
              <span className={`check-dot${c.done ? ' done' : ''}`}>
                {c.done && <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#0B2730" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </span>{c.label}
            </div>
          ))}
          <p>Only the home and buyer are required. Everything else makes the gift better.</p>
          <button className="btn btn-primary" style={{ height: 50, borderRadius: 14 }} disabled={!ready}
            onClick={async () => { window.clearTimeout(timer.current); await saveHome(home); nav(`/homes/${id}/send`) }}>Preview &amp; send</button>
        </aside>
      </div>
    </div>
  )
}
