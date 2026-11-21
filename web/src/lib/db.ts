import {
  collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, where,
} from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { firebaseConfigured, getFbDb, getFbStorage } from './firebase'
import type { DocFolder, Home, HomeDocument, Vendor } from './types'
import { uploadFile } from './storage'

// One data layer, two backends: Firestore when configured, localStorage in demo mode.
const K = { homes: 'keyly.demo.homes', vendors: 'keyly.demo.vendors', docs: (h: string) => `keyly.demo.docs.${h}` }
const read = <T,>(k: string): T[] => JSON.parse(localStorage.getItem(k) ?? '[]')
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

export function newId(kind: 'homes' | 'vendors' | 'docs', homeId?: string): string {
  if (firebaseConfigured) {
    const col = kind === 'docs' ? collection(getFbDb(), 'homes', homeId!, 'documents') : collection(getFbDb(), kind)
    return doc(col).id
  }
  return crypto.randomUUID()
}

/* ---------- Homes ---------- */
export async function listHomes(agentId: string): Promise<Home[]> {
  if (!firebaseConfigured) return read<Home>(K.homes).filter((h) => h.agentId === agentId).sort((a, b) => b.createdAt - a.createdAt)
  const snap = await getDocs(query(collection(getFbDb(), 'homes'), where('agentId', '==', agentId)))
  return snap.docs.map((d) => ({ ...(d.data() as Home), id: d.id })).sort((a, b) => b.createdAt - a.createdAt)
}

export async function getHome(id: string): Promise<Home | null> {
  if (!firebaseConfigured) return read<Home>(K.homes).find((h) => h.id === id) ?? null
  const snap = await getDoc(doc(getFbDb(), 'homes', id))
  return snap.exists() ? { ...(snap.data() as Home), id: snap.id } : null
}

export async function saveHome(home: Home): Promise<void> {
  const h = clean({ ...home, updatedAt: Date.now() })
  if (!firebaseConfigured) {
    const all = read<Home>(K.homes).filter((x) => x.id !== h.id)
    write(K.homes, [...all, h])
    return
  }
  await setDoc(doc(getFbDb(), 'homes', h.id), h)
}

/* ---------- Documents ---------- */
export async function listDocuments(homeId: string): Promise<HomeDocument[]> {
  if (!firebaseConfigured) return read<HomeDocument>(K.docs(homeId)).sort((a, b) => a.createdAt - b.createdAt)
  const snap = await getDocs(query(collection(getFbDb(), 'homes', homeId, 'documents'), orderBy('createdAt')))
  return snap.docs.map((d) => ({ ...(d.data() as HomeDocument), id: d.id }))
}

export async function addDocument(homeId: string, file: File, folder: DocFolder = 'closing'): Promise<HomeDocument> {
  const id = newId('docs', homeId)
  const storagePath = await uploadFile(`homes/${homeId}/docs/${id}-${file.name}`, file)
  const d: HomeDocument = { id, name: file.name, folder, storagePath, uploadedBy: 'agent', createdAt: Date.now() }
  if (!firebaseConfigured) write(K.docs(homeId), [...read<HomeDocument>(K.docs(homeId)), d])
  else await setDoc(doc(getFbDb(), 'homes', homeId, 'documents', id), d)
  return d
}

export async function setDocumentFolder(homeId: string, docId: string, folder: DocFolder): Promise<void> {
  if (!firebaseConfigured) {
    write(K.docs(homeId), read<HomeDocument>(K.docs(homeId)).map((d) => (d.id === docId ? { ...d, folder } : d)))
    return
  }
  await setDoc(doc(getFbDb(), 'homes', homeId, 'documents', docId), { folder }, { merge: true })
}

export async function removeDocument(homeId: string, d: HomeDocument): Promise<void> {
  if (!firebaseConfigured) {
    localStorage.removeItem(`keyly.demo.file.${d.storagePath}`)
    write(K.docs(homeId), read<HomeDocument>(K.docs(homeId)).filter((x) => x.id !== d.id))
    return
  }
  await deleteObject(ref(getFbStorage(), d.storagePath)).catch(() => {})
  await deleteDoc(doc(getFbDb(), 'homes', homeId, 'documents', d.id))
}

/* ---------- Vendors (UI comes in step 5) ---------- */
export async function listVendors(agentId: string): Promise<Vendor[]> {
  if (!firebaseConfigured) return read<Vendor>(K.vendors).filter((v) => v.agentId === agentId).sort((a, b) => a.createdAt - b.createdAt)
  const snap = await getDocs(query(collection(getFbDb(), 'vendors'), where('agentId', '==', agentId)))
  return snap.docs.map((d) => ({ ...(d.data() as Vendor), id: d.id })).sort((a, b) => a.createdAt - b.createdAt)
}

export async function saveVendor(v: Vendor): Promise<void> {
  const x = clean(v)
  if (!firebaseConfigured) { write(K.vendors, [...read<Vendor>(K.vendors).filter((y) => y.id !== x.id), x]); return }
  await setDoc(doc(getFbDb(), 'vendors', x.id), x)
}

export async function deleteVendor(id: string): Promise<void> {
  if (!firebaseConfigured) { write(K.vendors, read<Vendor>(K.vendors).filter((y) => y.id !== id)); return }
  await deleteDoc(doc(getFbDb(), 'vendors', id))
}
