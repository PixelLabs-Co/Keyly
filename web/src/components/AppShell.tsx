import { NavLink, Outlet } from 'react-router-dom'
import { LogoTile } from './Logo'
import { Wordmark } from './Logo'
import './AppShell.css'

const NAV = [
  { to: '/homes', label: 'Homes' },
  { to: '/vendors', label: 'My vendors' },
  { to: '/brand', label: 'Brand' },
  { to: '/account', label: 'Account & plan' },
]

export default function AppShell() {
  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Main">
        <NavLink to="/homes" className="sidebar-logo">
          <LogoTile size={34} />
          <span className="sidebar-brand">
            <Wordmark size={20} />
            <span className="sidebar-sub">for agents</span>
          </span>
        </NavLink>
        <div className="sidebar-links">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <span className="dot" />
              {n.label}
            </NavLink>
          ))}
        </div>
        <div className="sidebar-spacer" />
        <div className="agent-card">
          <span className="agent-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8.5" r="3.6" fill="none" stroke="#0E4D5C" strokeWidth="2" />
              <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" fill="none" stroke="#0E4D5C" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="agent-meta">
            <span className="agent-name">[Agent Name]</span>
            <span className="agent-brokerage">[Brokerage]</span>
          </span>
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
