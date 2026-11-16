import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig)

// Auth instance & providers
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Helper functions
export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signupWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function logoutUser() {
  return signOut(auth)
}

export default app
