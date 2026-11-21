import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// Config comes from env vars (see .env.example). No keys are committed.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** True once real Firebase values are in .env.local. Otherwise the app runs in local demo mode. */
export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let app: FirebaseApp | null = null
function getApp(): FirebaseApp {
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export const getFbAuth = (): Auth => getAuth(getApp())
export const getFbDb = (): Firestore => getFirestore(getApp())
export const getFbStorage = (): FirebaseStorage => getStorage(getApp())
