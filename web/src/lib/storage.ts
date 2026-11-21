import { useEffect, useState } from 'react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { firebaseConfigured, getFbStorage } from './firebase'

// In demo mode files are kept in the browser (localStorage data URLs).
const key = (path: string) => `keyly.demo.file.${path}`

export async function uploadFile(path: string, file: File): Promise<string> {
  if (firebaseConfigured) {
    await uploadBytes(ref(getFbStorage(), path), file)
    return path
  }
  if (file.size > 1_500_000) throw new Error('Demo mode: please choose a file under 1.5 MB.')
  const data = await new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(r.error)
    r.readAsDataURL(file)
  })
  localStorage.setItem(key(path), data)
  return path
}

export async function fileUrl(path: string): Promise<string | null> {
  if (firebaseConfigured) return getDownloadURL(ref(getFbStorage(), path))
  return localStorage.getItem(key(path))
}

/** Resolve a stored path to a displayable URL. */
export function useFileUrl(path?: string): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    if (!path) { setUrl(null); return }
    fileUrl(path).then((u) => live && setUrl(u)).catch(() => live && setUrl(null))
    return () => { live = false }
  }, [path])
  return url
}
