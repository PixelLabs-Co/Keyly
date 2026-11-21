import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getBytes } from 'firebase/storage'

const R = new URL('../', import.meta.url).pathname
const env = await initializeTestEnvironment({
  projectId: 'keyly-test',
  firestore: { rules: readFileSync(R + 'firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  storage: { rules: readFileSync(R + 'storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
})
let pass = 0, fail = 0
const t = async (name, p) => { try { await p; pass++; console.log('  ok  ', name) } catch (e) { fail++; console.log('  FAIL', name, '-', String(e.message).split('\n')[0]) } }

const alice = env.authenticatedContext('alice'), bob = env.authenticatedContext('bob'), buyer = env.authenticatedContext('buyer1'), anon = env.unauthenticatedContext()
const A = alice.firestore(), B = bob.firestore(), BU = buyer.firestore(), N = anon.firestore()

console.log('Firestore')
await t('agent writes own profile', assertSucceeds(setDoc(doc(A, 'agents/alice'), { name: 'A' })))
await t('other agent cannot read it', assertFails(getDoc(doc(B, 'agents/alice'))))
await t('signed-out cannot read it', assertFails(getDoc(doc(N, 'agents/alice'))))
await t('agent cannot write someone else', assertFails(setDoc(doc(A, 'agents/bob'), { name: 'x' })))
await t('agent creates own vendor', assertSucceeds(setDoc(doc(A, 'vendors/v1'), { agentId: 'alice', company: 'P' })))
await t('agent cannot create vendor for another agent', assertFails(setDoc(doc(A, 'vendors/v2'), { agentId: 'bob', company: 'P' })))
await t('other agent cannot read vendor', assertFails(getDoc(doc(B, 'vendors/v1'))))
await t('other agent cannot change vendor owner', assertFails(updateDoc(doc(B, 'vendors/v1'), { agentId: 'bob' })))
await t('agent creates own home', assertSucceeds(setDoc(doc(A, 'homes/h1'), { agentId: 'alice', address: '1 A St', buyerUids: [] })))
await t('agent cannot create home for another agent', assertFails(setDoc(doc(A, 'homes/h2'), { agentId: 'bob' })))
await t('agent lists own homes (query)', assertSucceeds(getDocs(query(collection(A, 'homes'), where('agentId', '==', 'alice')))))
await t('agent cannot list all homes', assertFails(getDocs(collection(A, 'homes'))))
await t('other agent cannot read home', assertFails(getDoc(doc(B, 'homes/h1'))))
await t('other agent cannot edit home', assertFails(updateDoc(doc(B, 'homes/h1'), { address: 'x' })))
await t('other agent cannot delete home', assertFails(deleteDoc(doc(B, 'homes/h1'))))
await t('agent cannot reassign home owner', assertFails(updateDoc(doc(A, 'homes/h1'), { agentId: 'bob' })))
await t('unlinked buyer cannot read home', assertFails(getDoc(doc(BU, 'homes/h1'))))
await env.withSecurityRulesDisabled(async (c) => { await updateDoc(doc(c.firestore(), 'homes/h1'), { buyerUids: ['buyer1'] }) })
await t('linked buyer reads their home', assertSucceeds(getDoc(doc(BU, 'homes/h1'))))
await t('buyer cannot edit home', assertFails(updateDoc(doc(BU, 'homes/h1'), { address: 'hacked' })))
await t('buyer cannot self-link to another home', assertFails(updateDoc(doc(BU, 'homes/h1'), { buyerUids: ['buyer1', 'x'] })))
await t('agent adds document', assertSucceeds(setDoc(doc(A, 'homes/h1/documents/d1'), { name: 'x', uploadedBy: 'agent' })))
await t('buyer reads documents', assertSucceeds(getDoc(doc(BU, 'homes/h1/documents/d1'))))
await t('buyer adds own document', assertSucceeds(setDoc(doc(BU, 'homes/h1/documents/d2'), { name: 'y', uploadedBy: 'buyer' })))
await t('buyer cannot add as agent', assertFails(setDoc(doc(BU, 'homes/h1/documents/d3'), { name: 'z', uploadedBy: 'agent' })))
await t('buyer cannot delete document', assertFails(deleteDoc(doc(BU, 'homes/h1/documents/d1'))))
await t('other agent cannot read documents', assertFails(getDoc(doc(B, 'homes/h1/documents/d1'))))

console.log('Storage')
const file = new Uint8Array([37, 80, 68, 70]); const pdf = { contentType: 'application/pdf' }, img = { contentType: 'image/png' }
const SA = alice.storage(), SB = bob.storage(), SBU = buyer.storage(), SN = anon.storage()
await t('agent uploads own logo', assertSucceeds(uploadBytes(ref(SA, 'agents/alice/logo.png'), file, img)))
await t('other agent cannot overwrite it', assertFails(uploadBytes(ref(SB, 'agents/alice/logo.png'), file, img)))
await t('signed-out cannot read logo', assertFails(getBytes(ref(SN, 'agents/alice/logo.png'))))
await t('agent uploads home photo (home exists)', assertSucceeds(uploadBytes(ref(SA, 'homes/h1/photo.png'), file, img)))
await t('agent uploads document', assertSucceeds(uploadBytes(ref(SA, 'homes/h1/docs/d1-closing.pdf'), file, pdf)))
await t('other agent cannot upload to home', assertFails(uploadBytes(ref(SB, 'homes/h1/docs/evil.pdf'), file, pdf)))
await t('other agent cannot read home file', assertFails(getBytes(ref(SB, 'homes/h1/docs/d1-closing.pdf'))))
await t('buyer reads home file', assertSucceeds(getBytes(ref(SBU, 'homes/h1/docs/d1-closing.pdf'))))
await t('buyer uploads document', assertSucceeds(uploadBytes(ref(SBU, 'homes/h1/docs/d2-mine.pdf'), file, pdf)))
await t('buyer cannot replace home photo', assertFails(uploadBytes(ref(SBU, 'homes/h1/photo.png'), file, img)))
await t('non-image/pdf rejected', assertFails(uploadBytes(ref(SA, 'homes/h1/docs/x.exe'), file, { contentType: 'application/x-msdownload' })))
await t('upload to non-existent home rejected', assertFails(uploadBytes(ref(SA, 'homes/nohome/photo.png'), file, img)))

console.log(`\n${pass} passed, ${fail} failed`)
await env.cleanup(); process.exit(fail ? 1 : 0)
