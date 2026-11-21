import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { LogoTile, Wordmark } from '../components/Logo'
import './SignIn.css'

export default function SignIn() {
  const { user, profile, loading, demo, signInWithApple, signInWithGoogle, sendEmailLink } = useAuth()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  if (!loading && user) return <Navigate to={profile ? '/homes' : '/brand'} replace />

  const run = (fn: () => Promise<unknown>) => async () => {
    setErr(''); setMsg('')
    try { await fn() } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong') }
  }

  return (
    <div className="signin">
      <div className="signin-brand">
        <div className="signin-logo"><LogoTile size={36} /><span style={{ fontSize: 22 }}><Wordmark size={22} /></span></div>
        <div className="signin-pitch">
          <svg width="260" height="160" viewBox="0 0 260 160" aria-hidden="true">
            <circle cx="170" cy="80" r="70" fill="#E2725B" />
            <g transform="translate(58 4) scale(1.5)"><KeyGlyphInline /></g>
          </svg>
          <h1>The closing gift that keeps you in the picture.</h1>
          <p>Give every buyer a beautiful home app with your name on it. They get their documents, reminders and trusted pros. You stay one tap away.</p>
        </div>
      </div>
      <div className="signin-form-wrap">
        <div className="signin-form">
          <h2>Sign in</h2>
          <p className="muted">Welcome back. Pick up where you left off.</p>
          {demo && <p className="demo-note">Demo mode: Firebase isn't connected yet, so any option signs you in locally.</p>}
          <button className="btn si-apple" onClick={run(signInWithApple)}>Continue with Apple</button>
          <button className="btn btn-ghost si-btn" onClick={run(signInWithGoogle)}>Continue with Google</button>
          <div className="si-or"><span /><em>or</em><span /></div>
          <label className="si-label">Email
            <input className="input" type="email" placeholder="you@brokerage.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="btn btn-primary si-btn" disabled={!email} onClick={run(async () => {
            const r = await sendEmailLink(email)
            if (r === 'sent') setMsg('Check your inbox for your sign-in link.')
          })}>Email me a sign-in link</button>
          {msg && <p role="status" className="si-msg">{msg}</p>}
          {err && <p role="alert" className="si-err">{err}</p>}
          <p className="si-new">New to Keyly? <button className="linklike" onClick={run(signInWithGoogle)}>Start your free trial</button></p>
        </div>
      </div>
    </div>
  )
}

function KeyGlyphInline() {
  // Cream key on clay circle, as in the design's brand panel.
  return (
    <g transform="rotate(-18 50 50)">
      <path d="M50 8L80 32V56H20V32Z" fill="#F4EDE1" stroke="#F4EDE1" strokeWidth="6" strokeLinejoin="round" />
      <circle cx="50" cy="33" r="6" fill="#0E4D5C" />
      <path d="M47 35H53L55 47H45Z" fill="#0E4D5C" />
      <rect x="43" y="52" width="14" height="40" rx="4" fill="#F4EDE1" />
      <rect x="53" y="68" width="16" height="9" rx="2.5" fill="#F4EDE1" />
      <rect x="53" y="81" width="11" height="9" rx="2.5" fill="#F4EDE1" />
    </g>
  )
}
