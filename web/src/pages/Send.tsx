import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getHome, saveHome } from '../lib/db'
import { canReach, deliverInvite, inviteLink, newToken, type InviteMethod } from '../lib/invites'
import { useFileUrl } from '../lib/storage'
import { buyerPeople, type Home } from '../lib/types'
import PhonePreview from '../components/PhonePreview'
import './pages.css'

const METHODS: { key: InviteMethod; label: string }[] = [{ key: 'text', label: 'Text' }, { key: 'email', label: 'Email' }, { key: 'both', label: 'Both' }]

export default function Send() {
  const { id = '' } = useParams()
  const { user, profile } = useAuth()
  const [home, setHome] = useState<Home | null | undefined>(undefined)
  const [note, setNote] = useState('')
  const [method, setMethod] = useState<InviteMethod>('text')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState('')
  const headshot = useFileUrl(profile?.headshotPath)

  useEffect(() => {
    if (!user) return
    getHome(id).then((h) => {
      if (!h || h.agentId !== user.uid) return setHome(null)
      setHome(h); setNote(h.welcomeNote)
      if (h.invite) { setMethod(h.invite.method); setSent(h.status !== 'draft') }
    })
  }, [id, user])

  if (home === undefined || !profile) return <p>Loading…</p>
  if (home === null) return <div><Link to="/homes" className="back">‹ Homes</Link><p>We couldn’t find that home.</p></div>

  const people = buyerPeople(home)
  const reach = people.filter((p) => canReach(p, method))
  const phones = reach.filter((p) => method !== 'email' && p.phone).map((p) => p.phone)
  const emails = reach.filter((p) => method !== 'text' && p.email).map((p) => p.email)
  const recipient = [...phones, ...emails].join(' · ')
  const buyerNames = home.buyer.names || 'your buyer'

  const send = async () => {
    setBusy(true); setErr('')
    try {
      const invites = (home.invites?.length ? home.invites : reach.map((p) => ({ token: newToken(), name: p.name, email: p.email, phone: p.phone })))
      // Keep existing links on a re-send; add links for buyers who were added since.
      const all = [...invites]
      for (const p of reach) if (!all.some((i) => i.name === p.name && i.email === p.email && i.phone === p.phone)) all.push({ token: newToken(), name: p.name, email: p.email, phone: p.phone })
      for (const i of all.filter((x) => canReach(x, method))) await deliverInvite({ home, buyer: i, link: inviteLink(i.token), method, note })
      const next: Home = { ...home, welcomeNote: note, status: home.status === 'active' ? 'active' : 'invited', invites: all, invite: { token: all[0].token, method, sentAt: Date.now() } }
      await saveHome(next)
      setHome(next); setSent(true)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not send') } finally { setBusy(false) }
  }

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(inviteLink(token))
    setCopied(token); window.setTimeout(() => setCopied(''), 2000)
  }

  const links = home.invites ?? []

  return (
    <div className="stack" style={{ gap: 22 }}>
      <Link to={`/homes/${id}`} className="back">‹ Home details</Link>
      <div>
        <h1 className="page-title">Preview &amp; send</h1>
        <p className="muted" style={{ margin: '4px 0 0' }}>This is exactly what {buyerNames} will see when they open your gift.</p>
      </div>
      <div className="detail-cols" style={{ gap: 32 }}>
        <div className="send-phone">
          <PhonePreview large hideAddress color={profile.brandColor} name={profile.name} brokerage={profile.brokerage} headshotUrl={headshot} note={note} />
        </div>
        <div className="detail-main" style={{ flexBasis: 420 }}>
          {!sent ? (
            <>
              <section className="card sec" style={{ gap: 12 }}>
                <label htmlFor="note" className="section-title">Your welcome note</label>
                <textarea id="note" rows={5} className="input note-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a short, personal note…" />
                <p className="sec-sub" style={{ margin: 0, fontSize: 12 }}>The preview updates as you type.</p>
              </section>
              <section className="card sec" style={{ gap: 14 }}>
                <h2 className="section-title">Send it by</h2>
                <div className="vchips">
                  {METHODS.map((m) => <button key={m.key} className="chip" aria-pressed={m.key === method} onClick={() => setMethod(m.key)}>{m.label}</button>)}
                </div>
                {reach.length > 0 ? (
                  <p className="muted" style={{ margin: 0, fontSize: 14 }}>To {reach.map((p) => p.name).filter(Boolean).join(', ') || buyerNames} · {recipient}</p>
                ) : (
                  <p role="alert" style={{ margin: 0, fontSize: 14, color: '#B3261E', fontWeight: 600 }}>
                    No {method === 'text' ? 'mobile number' : method === 'email' ? 'email' : 'mobile number or email'} on file. <Link to={`/homes/${id}/edit`}>Add one</Link> to send.
                  </p>
                )}
                {people.length > reach.length && reach.length > 0 && (() => {
                  const n = people.length - reach.length
                  return <p className="sec-sub" style={{ margin: 0 }}>{n} {n === 1 ? 'buyer has' : 'buyers have'} no {method === 'text' ? 'mobile number' : 'email'} and won’t get this. <Link to={`/homes/${id}/edit`}>Edit</Link></p>
                })()}
              </section>
              {err && <p role="alert" style={{ color: '#B3261E', fontWeight: 600, margin: 0 }}>{err}</p>}
              <button className="btn btn-primary" style={{ height: 56, borderRadius: 16, fontSize: 16 }} disabled={busy || reach.length === 0} onClick={send}>
                {busy ? 'Sending…' : 'Send the gift'}
              </button>
            </>
          ) : (
            <section className="sent-card" aria-live="polite">
              <span className="sent-check"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#0B2730" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <h2>Your gift is on its way.</h2>
              <p>We’ll let you know when {buyerNames} opens it. You can keep editing the home anytime; changes show up in their app.</p>
              <div className="row-gap">
                {links.map((l) => (
                  <button key={l.token} className="btn" style={{ background: 'var(--cream)', color: 'var(--ink)', borderRadius: 14 }} onClick={() => copy(l.token)}>
                    {copied === l.token ? 'Copied ✓' : links.length > 1 ? `Copy link for ${l.name.split(' ')[0] || 'buyer'}` : 'Copy invite link'}
                  </button>
                ))}
                <Link to="/homes" className="btn" style={{ boxShadow: 'inset 0 0 0 1.5px var(--sea-glass)', color: 'var(--cream)', borderRadius: 14 }}>Back to Homes</Link>
              </div>
              <button className="linklike" style={{ color: 'var(--sea-glass)', alignSelf: 'flex-start', minHeight: 44 }} onClick={() => setSent(false)}>Edit note and send again</button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
