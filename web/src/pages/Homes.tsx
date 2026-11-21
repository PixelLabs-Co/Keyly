import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { listHomes } from '../lib/db'
import { useFileUrl } from '../lib/storage'
import { formatDate, type Home, type HomeStatus } from '../lib/types'
import './pages.css'

const FILTERS: ('All' | HomeStatus)[] = ['All', 'draft', 'invited', 'active']
const LABEL: Record<string, string> = { All: 'All', draft: 'Draft', invited: 'Invited', active: 'Active' }

function Row({ h }: { h: Home }) {
  const photo = useFileUrl(h.photoPath)
  return (
    <Link to={`/homes/${h.id}`} className="trow">
      <span className="home-cell">
        <span className="home-icon">
          {photo ? <img src={photo} alt="" /> : (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill="none" stroke="#0E4D5C" strokeWidth="2" strokeLinejoin="round" /></svg>
          )}
        </span>
        <span>{h.address || 'Untitled home'}</span>
      </span>
      <span>{h.buyer.names || '—'}</span>
      <span className="muted">{formatDate(h.closingDate)}</span>
      <span><span className={`pill pill-${h.status}`}>{LABEL[h.status]}</span></span>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="#3F5A62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </Link>
  )
}

export default function Homes() {
  const { user } = useAuth()
  const [homes, setHomes] = useState<Home[] | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [q, setQ] = useState('')

  useEffect(() => { if (user) listHomes(user.uid).then(setHomes) }, [user])

  const shown = (homes ?? []).filter((h) =>
    (filter === 'All' || h.status === filter) &&
    `${h.address} ${h.buyer.names}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="stack">
      <div className="head-row">
        <div>
          <h1 className="page-title">Homes</h1>
          <p className="muted">Every home you’ve set up for a buyer.</p>
        </div>
        <div className="row-gap">
          <label className="search">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="#3F5A62" strokeWidth="2" /><path d="M16 16l4 4" stroke="#3F5A62" strokeWidth="2" strokeLinecap="round" /></svg>
            <input type="search" aria-label="Search homes" placeholder="Search address or buyer" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <Link to="/homes/new" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#0B2730" strokeWidth="2.4" strokeLinecap="round" /></svg>Add a home
          </Link>
        </div>
      </div>
      <div className="chips">
        {FILTERS.map((f) => <button key={f} className="chip" aria-pressed={f === filter} onClick={() => setFilter(f)}>{LABEL[f]}</button>)}
      </div>
      <div className="table-card">
        <div className="table-inner">
          <div className="trow thead"><span>Home</span><span>Buyer</span><span>Closing</span><span>Status</span><span /></div>
          {homes === null ? <p className="empty">Loading…</p> : shown.length === 0 ? (
            <p className="empty">{homes.length === 0 ? 'No homes yet. Add your first home to get started.' : 'No homes match.'}</p>
          ) : shown.map((h) => <Row key={h.id} h={h} />)}
        </div>
      </div>
      <div className="tip"><i /><p>Tip: set up the home a week before closing, then send the gift at the closing table so it’s ready when they get the keys.</p></div>
    </div>
  )
}
