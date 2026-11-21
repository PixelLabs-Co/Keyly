import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider, OAuthProvider, isSignInWithEmailLink, onAuthStateChanged,
  sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup, signOut as fbSignOut, deleteUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { firebaseConfigured, getFbAuth, getFbDb } from './firebase'
import { deleteAgentData } from './db'

export type AgentProfile = {
  name: string
  brokerage: string
  phone: string
  email: string
  brandColor: string
  logoPath?: string
  headshotPath?: string
  plan?: { name: string; status: 'trial' | 'active' | 'canceled'; trialEndsAt: number }
  createdAt?: number
}

export type SignInMethod = 'Apple' | 'Google' | 'Email link'
export type AuthUser = { uid: string; email: string | null; method: SignInMethod }

type AuthState = {
  user: AuthUser | null
  /** null = not loaded yet; undefined profile means brand setup not done */
  profile: AgentProfile | null
  loading: boolean
  demo: boolean
  signInWithGoogle(): Promise<void>
  signInWithApple(): Promise<void>
  sendEmailLink(email: string): Promise<string>
  saveProfile(p: AgentProfile): Promise<void>
  signOut(): Promise<void>
  deleteAccount(): Promise<void>
}

const Ctx = createContext<AuthState | null>(null)
const EMAIL_KEY = 'keyly.emailForSignIn'
const DEMO_USER = 'keyly.demo.user'
const DEMO_PROFILE = 'keyly.demo.profile'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (u: AuthUser) => {
    if (firebaseConfigured) {
      const snap = await getDoc(doc(getFbDb(), 'agents', u.uid))
      setProfile(snap.exists() ? (snap.data() as AgentProfile) : null)
    } else {
      const raw = localStorage.getItem(DEMO_PROFILE)
      setProfile(raw ? JSON.parse(raw) : null)
    }
  }, [])

  useEffect(() => {
    if (!firebaseConfigured) {
      const raw = localStorage.getItem(DEMO_USER)
      if (raw) {
        const u = JSON.parse(raw) as AuthUser
        setUser(u)
        loadProfile(u).finally(() => setLoading(false))
      } else setLoading(false)
      return
    }
    const auth = getFbAuth()
    // Complete an emailed sign-in link if we landed from one.
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const email = localStorage.getItem(EMAIL_KEY) ?? window.prompt('Confirm your email to finish signing in') ?? ''
      signInWithEmailLink(auth, email, window.location.href).then(() => {
        localStorage.removeItem(EMAIL_KEY)
        window.history.replaceState({}, '', '/signin')
      }).catch(() => {})
    }
    return onAuthStateChanged(auth, async (fu) => {
      if (fu) {
        const pid = fu.providerData[0]?.providerId
        const u: AuthUser = { uid: fu.uid, email: fu.email, method: pid === 'apple.com' ? 'Apple' : pid === 'google.com' ? 'Google' : 'Email link' }
        setUser(u)
        await loadProfile(u)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
  }, [loadProfile])

  const demoSignIn = useCallback(async (method: SignInMethod, email?: string) => {
    const u: AuthUser = { uid: 'demo-agent', email: email ?? 'demo@keyly.app', method }
    localStorage.setItem(DEMO_USER, JSON.stringify(u))
    setUser(u)
    await loadProfile(u)
  }, [loadProfile])

  const value = useMemo<AuthState>(() => ({
    user, profile, loading, demo: !firebaseConfigured,
    async signInWithGoogle() {
      if (!firebaseConfigured) return demoSignIn('Google')
      await signInWithPopup(getFbAuth(), new GoogleAuthProvider())
    },
    async signInWithApple() {
      if (!firebaseConfigured) return demoSignIn('Apple')
      await signInWithPopup(getFbAuth(), new OAuthProvider('apple.com'))
    },
    async sendEmailLink(email) {
      if (!firebaseConfigured) { await demoSignIn('Email link', email); return 'demo' }
      await sendSignInLinkToEmail(getFbAuth(), email, { url: `${window.location.origin}/signin`, handleCodeInApp: true })
      localStorage.setItem(EMAIL_KEY, email)
      return 'sent'
    },
    async saveProfile(p) {
      if (!user) return
      // The plan and createdAt are set once, when the agent first saves their brand.
      const next: AgentProfile = {
        ...profile, ...p,
        plan: profile?.plan ?? { name: 'Keyly Pro', status: 'trial', trialEndsAt: Date.now() + 14 * 864e5 },
        createdAt: profile?.createdAt ?? Date.now(),
      }
      if (firebaseConfigured) await setDoc(doc(getFbDb(), 'agents', user.uid), JSON.parse(JSON.stringify(next)), { merge: true })
      else localStorage.setItem(DEMO_PROFILE, JSON.stringify(next))
      setProfile(next)
    },
    async signOut() {
      if (firebaseConfigured) await fbSignOut(getFbAuth())
      localStorage.removeItem(DEMO_USER)
      setUser(null)
      setProfile(null)
    },
    async deleteAccount() {
      if (!user) return
      await deleteAgentData(user.uid, profile)
      if (firebaseConfigured) {
        const fu = getFbAuth().currentUser
        if (fu) await deleteUser(fu) // may ask the agent to sign in again first (auth/requires-recent-login)
      }
      localStorage.removeItem(DEMO_USER)
      setUser(null)
      setProfile(null)
    },
  }), [user, profile, loading, demoSignIn])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
