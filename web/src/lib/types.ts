export type HomeStatus = 'draft' | 'invited' | 'active'
export type DocFolder = 'closing' | 'inspection' | 'warranties' | 'buyer'

export const FOLDER_LABELS: Record<DocFolder, string> = {
  closing: 'Closing documents',
  inspection: 'Inspection',
  warranties: 'Warranties & manuals',
  buyer: 'From buyer',
}

export type Reminder = { id: string; name: string; schedule: string; enabled: boolean }

export type BuyerPerson = { name: string; email: string; phone: string }

export type Home = {
  id: string
  agentId: string
  address: string
  photoPath?: string
  // names/email/phone mirror the first buyer so simple readers (and the buyer app) can use them as-is.
  buyer: { names: string; email: string; phone: string; people?: BuyerPerson[]; nameList?: string[] }
  closingDate: string // YYYY-MM-DD
  status: HomeStatus
  details: {
    furnaceYear: string
    waterHeaterYear: string
    roofYear: string
    wifi: string
    waterShutoff: string
    paintColors: string
    extra: { label: string; value: string }[]
  }
  reminders: Reminder[]
  vendorIds: string[]
  welcomeNote: string
  invite?: { token: string; method: 'text' | 'email' | 'both'; sentAt: number; openedAt?: number } // token = first buyer's
  invites?: { token: string; name: string; email: string; phone: string }[] // one link per buyer
  buyerUid?: string // legacy single buyer
  buyerUids?: string[] // one per buyer who accepts in the iPhone app
  createdAt: number
  updatedAt: number
}

export type HomeDocument = {
  id: string
  name: string
  folder: DocFolder
  storagePath: string
  uploadedBy: 'agent' | 'buyer'
  createdAt: number
}

export type Vendor = {
  id: string
  agentId: string
  category: string
  company: string
  phone: string
  website: string
  addToNewHomes: boolean
  createdAt: number
}

export const STARTER_REMINDERS: Reminder[] = [
  { id: 'smoke', name: 'Test smoke detectors', schedule: 'Every month', enabled: true },
  { id: 'hvac', name: 'Replace HVAC filter', schedule: 'Every 3 months', enabled: true },
  { id: 'dryer', name: 'Clean dryer vent', schedule: 'Every year', enabled: true },
  { id: 'gutters', name: 'Clean gutters', schedule: 'Spring and fall', enabled: false },
]

export function emptyHome(id: string, agentId: string, vendorIds: string[] = []): Home {
  const now = Date.now()
  return {
    id, agentId, address: '', buyer: { names: '', email: '', phone: '' }, closingDate: '', status: 'draft',
    details: { furnaceYear: '', waterHeaterYear: '', roofYear: '', wifi: '', waterShutoff: '', paintColors: '', extra: [] },
    reminders: STARTER_REMINDERS.map((r) => ({ ...r })),
    vendorIds, welcomeNote: '', createdAt: now, updatedAt: now,
  }
}

export function formatDate(d: string): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "Sam", "Sam & Alex", "Sam, Alex & Jo". Stored in buyer.names so the buyer app can show it as-is. */
export function formatNames(list: string[]): string {
  const n = list.map((x) => x.trim()).filter(Boolean)
  if (n.length <= 2) return n.join(' & ')
  return `${n.slice(0, -1).join(', ')} & ${n[n.length - 1]}`
}

/** All buyers on a home, including homes saved before per-buyer contacts existed. */
export function buyerPeople(h: Pick<Home, 'buyer'>): BuyerPerson[] {
  const b = h.buyer
  if (b.people?.length) return b.people
  if (b.nameList?.length) return b.nameList.map((name, i) => ({ name, email: i === 0 ? b.email : '', phone: i === 0 ? b.phone : '' }))
  return [{ name: b.names, email: b.email, phone: b.phone }]
}
