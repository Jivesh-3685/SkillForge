import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  onIdTokenChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [idToken, setIdToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch or create profile in Supabase (PostgreSQL)
  const syncUserProfile = async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const profile = await res.json()
        setUserProfile(profile)
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err)
    }
  }

  // Get current fresh ID token, optionally forcing a refresh from Firebase
  const getIdToken = useCallback(async (forceRefresh = false) => {
    const user = auth.currentUser || currentUser
    if (!user) return null
    try {
      const token = await user.getIdToken(forceRefresh)
      setIdToken(token)
      return token
    } catch (err) {
      console.error('Failed to get fresh Firebase ID token:', err)
      return null
    }
  }, [currentUser])

  // Authenticated fetch wrapper that automatically handles token renewal and 401 retry
  const apiFetch = useCallback(
    async (url, options = {}) => {
      let token = await getIdToken(false)
      const headers = new Headers(options.headers || {})
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      let res = await fetch(url, { ...options, headers })

      // If token expired (401), force-refresh and retry once
      if (res.status === 401 && (auth.currentUser || currentUser)) {
        console.warn('Received 401. Force-refreshing Firebase token and retrying request...')
        token = await getIdToken(true)
        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
          res = await fetch(url, { ...options, headers })
        }
      }

      return res
    },
    [getIdToken, currentUser]
  )

  useEffect(() => {
    // onIdTokenChanged fires on sign-in, sign-out, AND when Firebase refreshes the token (every ~55 mins)
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          const token = await user.getIdToken()
          setIdToken(token)
          await syncUserProfile(token)
        } catch (err) {
          console.error('Error fetching token on auth change:', err)
        }
      } else {
        setIdToken(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider)
    const token = await res.user.getIdToken(true)
    setIdToken(token)
    await syncUserProfile(token)
    return res
  }

  const loginWithEmail = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password)
    const token = await res.user.getIdToken(true)
    setIdToken(token)
    await syncUserProfile(token)
    return res
  }

  const signupWithEmail = async (email, password) => {
    const res = await createUserWithEmailAndPassword(auth, email, password)
    const token = await res.user.getIdToken(true)
    setIdToken(token)
    await syncUserProfile(token)
    return res
  }

  const logout = async () => {
    await signOut(auth)
    setCurrentUser(null)
    setUserProfile(null)
    setIdToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        idToken,
        getIdToken,
        apiFetch,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
