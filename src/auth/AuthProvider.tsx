import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { createContext, useEffect, useState, type ReactNode } from 'react'
import { auth, isFirebaseConfigured } from './firebase'

export interface AuthState {
  user: User | null
  loading: boolean
  configured: boolean
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signIn = async () => {
    if (!auth) return
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e) {
      const code = (e as { code?: string }).code
      // ignore the user simply closing the popup
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        window.alert('ההתחברות נכשלה. נסו שוב.')
      }
    }
  }

  const signOutUser = async () => {
    if (auth) await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, configured: isFirebaseConfigured, signIn, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}
