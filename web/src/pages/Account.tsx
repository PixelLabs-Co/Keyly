import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { HELP_LINKS, PLACEHOLDER_PLAN } from '../lib/config'
import './Account.css'

const fmt = (t?: number) => (t ? new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return <div className={`acc-row${last ? ' last' : ''}`}><span className="acc-label">{label}</span><span className="acc-val">{children}</span></div>
}

export default function Account() {
  const { user, profile, signOut, deleteAccount } = useAuth()
  const [note, setNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const plan = profile?.plan
  const soon = () => { setNote('Billing isn’t live yet. Plans and payments are coming soon.'); window.setTimeout(() => setNote(''), 4000) }

  const doDelete = async () => {
    setBusy(true); setErr('')
    try { await deleteAccount() } catch (e) {
      const code = (e as { code?: string }).code
      setErr(code === 'auth/requires-recent-login' ? 'For security, please sign out, sign back in, then delete your account.' : e instanceof Error ? e.message : 'Could not delete your account.')
      setBusy(false)
    }
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div>
        <h1 className="page-title">Account &amp; plan</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>Your subscription, billing and sign-in.</p>
      </div>

      <div className="acc-grid" style={{ alignItems: 'stretch' }}>
        <section className="plan-card">
          <p className="label" style={{ color: 'var(--sea-glass)', margin: 0 }}>Your plan</p>
          <div className="plan-name">
            <p className="big">{plan?.name ?? PLACEHOLDER_PLAN.name}</p>
            <p className="price">{PLACEHOLDER_PLAN.pricePerMonth} / month</p>
          </div>
          {plan?.status === 'trial' && <span className="trial-pill">Free trial · ends {fmt(plan.trialEndsAt)}</span>}
          <p className="plan-blurb">{PLACEHOLDER_PLAN.blurb}</p>
          <div style={{ flex: 1 }} />
          <div className="row-gap" style={{ gap: 10 }}>
            <button className="btn" style={{ background: 'var(--cream)', color: 'var(--ink)', borderRadius: 14 }} onClick={soon}>Change plan</button>
            <button className="btn" style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1.5px var(--sea-glass)', color: 'var(--cream)', borderRadius: 14, fontWeight: 700 }} onClick={soon}>Manage billing</button>
          </div>
          {note && <p role="status" className="plan-note">{note}</p>}
        </section>

        <section className="card acc-card">
          <h2 className="section-title">Billing</h2>
          <Row label="Payment method">No card on file</Row>
          <Row label="Next payment">{plan?.status === 'trial' ? fmt(plan.trialEndsAt) : '—'}</Row>
          <Row label="Invoices" last><button className="linklike" onClick={soon}>View all</button></Row>
        </section>
      </div>

      <div className="acc-grid">
        <section className="card acc-card">
          <h2 className="section-title">Sign-in</h2>
          <Row label="Email">{user?.email ?? profile?.email ?? '—'}</Row>
          <Row label="Signed in with">{user?.method ?? '—'}</Row>
          <Row label="Your brand" last><Link to="/brand" style={{ fontWeight: 700 }}>Edit brand</Link></Row>
        </section>
        <section className="card acc-card">
          <h2 className="section-title">Help</h2>
          <a className="help-link" href={HELP_LINKS.support}>Contact support<span>›</span></a>
          <a className="help-link" href={HELP_LINKS.privacy} target="_blank" rel="noreferrer">Privacy policy<span>›</span></a>
          <a className="help-link last" href={HELP_LINKS.terms} target="_blank" rel="noreferrer">Terms of service<span>›</span></a>
        </section>
      </div>

      <div className="row-gap" style={{ alignItems: 'center' }}>
        <button className="btn btn-ghost" style={{ borderRadius: 14, fontWeight: 700 }} onClick={() => signOut()}>Sign out</button>
        {!confirming && <button className="btn" style={{ background: 'transparent', color: '#9A3B27', fontWeight: 700 }} onClick={() => setConfirming(true)}>Delete account</button>}
      </div>

      {confirming && (
        <section className="card delete-card" role="alertdialog" aria-labelledby="del-h">
          <h2 id="del-h" className="section-title" style={{ color: '#9A3B27' }}>Delete your account?</h2>
          <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>This permanently deletes your brand, every home, all documents and your vendors. This can’t be undone.</p>
          <label className="field" style={{ maxWidth: 320 }}>Type DELETE to confirm
            <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
          {err && <p role="alert" style={{ color: '#B3261E', fontWeight: 600, margin: 0 }}>{err}</p>}
          <div className="row-gap">
            <button className="btn" style={{ background: '#9A3B27', color: '#fff', borderRadius: 14 }} disabled={typed !== 'DELETE' || busy} onClick={doDelete}>{busy ? 'Deleting…' : 'Delete everything'}</button>
            <button className="btn btn-ghost" style={{ borderRadius: 14 }} onClick={() => { setConfirming(false); setTyped(''); setErr('') }}>Cancel</button>
          </div>
        </section>
      )}
    </div>
  )
}
