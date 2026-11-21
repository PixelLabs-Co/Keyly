import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

/** Signed-in agents only. New agents (no profile yet) are sent to /brand first. */
export default function RequireAgent() {
  const { user, profile, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <p style={{ padding: 40 }}>Loading…</p>
  if (!user) return <Navigate to="/signin" replace />
  if (!profile && loc.pathname !== '/brand') return <Navigate to="/brand" replace />
  return <Outlet />
}
