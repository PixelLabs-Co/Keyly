import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { listVendors, newId, saveHome } from '../lib/db'
import { uploadFile } from '../lib/storage'
import { emptyHome } from '../lib/types'
import './pages.css'

export default function NewHome() {
  const { user } = useAuth()
  const nav = useNavigate()
  const homeId = useMemo(() => newId('homes'), [])
  const [f, setF] = useState({ address: '', names: '', closingDate: '', email: '', phone: '' })
  const [photoPath, setPhotoPath] = useState<string>()
  const [preview, setPreview] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const pickPhoto = async (p: File) => {
    setErr('')
    try {
      const ext = p.name.split('.').pop() || 'jpg'
      setPhotoPath(await uploadFile(`homes/${homeId}/photo.${ext}`, p))
      setPreview(URL.createObjectURL(p))
    } catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed') }
  }

  const save = async (next: 'list' | 'details') => {
    if (!user) return
    if (!f.address.trim()) { setErr('Please add the home’s address.'); return }
    setBusy(true); setErr('')
    try {
      // New homes start with the vendors the agent flagged "Add to new homes".
      const vendors = await listVendors(user.uid)
      const home = emptyHome(homeId, user.uid, vendors.filter((v) => v.addToNewHomes).map((v) => v.id))
      home.address = f.address.trim()
      home.photoPath = photoPath
      home.buyer = { names: f.names.trim(), email: f.email.trim(), phone: f.phone.trim() }
      home.closingDate = f.closingDate
      await saveHome(home)
      nav(next === 'list' ? '/homes' : `/homes/${homeId}`)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save'); setBusy(false) }
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      <Link to="/homes" className="back">‹ Homes</Link>
      <div>
        <h1 className="page-title">Add a home</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>Start with the basics. You can fill in documents and details next.</p>
      </div>
      <ol className="steps">
        <li className="on"><span>1</span>Home &amp; buyer</li>
        <li><span>2</span>Details</li>
        <li><span>3</span>Preview &amp; send</li>
      </ol>
      <div className="form-narrow">
        <section className="card sec">
          <h2 className="section-title">The home</h2>
          <label className="field">Address<input className="input" value={f.address} onChange={set('address')} placeholder="Start typing an address" /></label>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && pickPhoto(e.target.files[0])} />
          <button type="button" className="dropzone" style={{ minHeight: 140 }} onClick={() => file.current?.click()}>
            {preview ? <img src={preview} alt="Home" /> : (
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="#0E4D5C" strokeWidth="2" /><circle cx="9" cy="10" r="1.8" fill="#0E4D5C" /><path d="M5 17l5-4 3 2 3-3 3 3" fill="none" stroke="#0E4D5C" strokeWidth="2" strokeLinejoin="round" /></svg>
            )}
            {preview ? 'Replace photo' : 'Add a home photo'}<small>It becomes the cover of their app</small>
          </button>
        </section>
        <section className="card sec">
          <h2 className="section-title">The buyer</h2>
          <div className="fields">
            <label>Buyer name(s)<input className="input" value={f.names} onChange={set('names')} placeholder="Buyer names" /></label>
            <label>Closing date<input className="input" type="date" value={f.closingDate} onChange={set('closingDate')} /></label>
            <label>Email<input className="input" type="email" value={f.email} onChange={set('email')} placeholder="Buyer email" /></label>
            <label>Mobile phone<input className="input" type="tel" value={f.phone} onChange={set('phone')} placeholder="Buyer phone" /></label>
          </div>
          <p className="sec-sub">Nothing is sent to the buyer until you choose to send it.</p>
        </section>
        {err && <p role="alert" style={{ color: '#B3261E', fontWeight: 600, margin: 0 }}>{err}</p>}
        <div className="actions">
          <button className="btn btn-ghost" disabled={busy} onClick={() => save('list')}>Save as draft</button>
          <button className="btn btn-primary" disabled={busy} onClick={() => save('details')}>Continue to details →</button>
        </div>
      </div>
    </div>
  )
}
