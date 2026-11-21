import type { Home } from './types'

export type InviteMethod = 'text' | 'email' | 'both'

/** Random, unguessable token for an invite link. */
export function newToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Where a buyer lands. Works on any host and under a sub-path (e.g. GitHub Pages). */
export function inviteLink(token: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}gift/${token}`
}

/** True if this buyer can receive the invite by the chosen method. */
export function canReach(p: { email: string; phone: string }, m: InviteMethod): boolean {
  return m === 'text' ? Boolean(p.phone) : m === 'email' ? Boolean(p.email) : Boolean(p.phone || p.email)
}

/**
 * The ONE place that actually delivers an invite. v1 does not send anything:
 * it only records the invite. To go live, call a Cloud Function here that uses
 * the Firebase "Trigger Email" extension (email) and/or Twilio (text).
 */
export async function deliverInvite(_args: {
  home: Home
  buyer: { name: string; email: string; phone: string }
  link: string
  method: InviteMethod
  note: string
}): Promise<void> {
  // Intentionally a no-op for v1.
}
