import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { uploadFile, useFileUrl } from '../lib/storage'
import PhonePreview, { BRAND_COLORS } from '../components/PhonePreview'
import './Brand.css'

function Upload({ label, hint, url, onFile, round }: { label: string; hint: string; url: string | null; onFile: (f: File) => void; round?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <button type="button" className="upload" onClick={() => input.current?.click()}>
        {url ? (
          <img src={url} alt="" className={round ? 'upload-img round' : 'upload-img'} />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" fill="none" stroke="#0E4D5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
        <span className="upload-text"><strong>{url ? `Replace ${label.toLowerCase()}` : label}</strong><small>{hint}</small></span>
      </button>
    </>
  )
}

export default function Brand() {
  const { user, profile, saveProfile } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    brokerage: profile?.brokerage ?? '',
    phone: profile?.phone ?? '',
    email: profile?.email ?? user?.email ?? '',
    brandColor: profile?.brandColor ?? BRAND_COLORS[0].hex,
    logoPath: profile?.logoPath,
    headshotPath: profile?.headshotPath,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const logo = useFileUrl(form.logoPath)
  const headshot = useFileUrl(form.headshotPath)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })
  const current = BRAND_COLORS.find((c) => c.hex === form.brandColor) ?? BRAND_COLORS[0]

  const upload = (kind: 'logo' | 'headshot') => async (f: File) => {
    if (!user) return
    setErr('')
    try {
      const ext = f.name.split('.').pop() || 'png'
      const path = await uploadFile(`agents/${user.uid}/${kind}.${ext}`, f)
      setForm((s) => ({ ...s, [kind === 'logo' ? 'logoPath' : 'headshotPath']: path }))
    } catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed') }
  }

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const clean = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== undefined)) as typeof form
      await saveProfile(clean)
      nav('/homes')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save') } finally { setSaving(false) }
  }

  return (
    <div className="brand-page">
      <div>
        <h1 className="page-title">Your brand</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>This is how you’ll appear in every buyer’s Keyly app.</p>
      </div>
      <div className="brand-cols">
        <div className="brand-form">
          <section className="card brand-sec">
            <h2 className="section-title">Logo &amp; photo</h2>
            <div className="upload-row">
              <Upload label="Upload your logo" hint="PNG or SVG" url={logo} onFile={upload('logo')} />
              <Upload label="Add your headshot" hint="Buyers see this first" url={headshot} onFile={upload('headshot')} round />
            </div>
          </section>
          <section className="card brand-sec">
            <div>
              <h2 className="section-title">Brand color</h2>
              <p className="muted small">Used on the buyer’s welcome screen and your agent card.</p>
            </div>
            <div className="swatches">
              {BRAND_COLORS.map((c) => (
                <button key={c.hex} type="button" aria-label={c.name} aria-pressed={c.hex === form.brandColor}
                  className={`swatch${c.hex === form.brandColor ? ' on' : ''}`} style={{ background: c.hex }}
                  onClick={() => setForm({ ...form, brandColor: c.hex })} />
              ))}
            </div>
            <p className="muted small">Selected: <strong style={{ color: 'var(--ink)' }}>{current.name}</strong> · {current.hex}</p>
          </section>
          <section className="card brand-sec">
            <h2 className="section-title">Your details</h2>
            <div className="fields">
              <label>Name<input className="input" value={form.name} onChange={set('name')} placeholder="Your name" /></label>
              <label>Brokerage<input className="input" value={form.brokerage} onChange={set('brokerage')} placeholder="Brokerage" /></label>
              <label>Phone<input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="Phone" /></label>
              <label>Email<input className="input" type="email" value={form.email} onChange={set('email')} placeholder="Email" /></label>
            </div>
          </section>
          {err && <p role="alert" style={{ color: '#B3261E', fontWeight: 600, margin: 0 }}>{err}</p>}
          <div><button className="btn btn-primary" style={{ height: 50, padding: '0 28px', borderRadius: 14 }} disabled={saving || !form.name} onClick={save}>{saving ? 'Saving…' : 'Save brand'}</button></div>
        </div>
        <div className="preview-panel">
          <p className="label muted" style={{ margin: 0 }}>Live preview</p>
          <PhonePreview color={form.brandColor} name={form.name} brokerage={form.brokerage} headshotUrl={headshot} />
          <p className="small muted" style={{ maxWidth: 280, textAlign: 'center', margin: 0 }}>Keyly keeps the rest of the app consistent so it always looks polished.</p>
        </div>
      </div>
    </div>
  )
}
