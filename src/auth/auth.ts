import { GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth'
import { createContext, useContext } from 'react'
import { auth } from '../data/firebase/app'

export type Role = 'admin' | 'support' | 'sales'

export type HqUser = {
  id: string
  name: string
  email: string
  // null means the person signed in but has no HQ access
  role: Role | null
}

export async function login() {
  await signInWithPopup(auth, new GoogleAuthProvider())
}

export async function logout() {
  await signOut(auth)
}

// Role comes from the `role` custom claim set on the Firebase user
export function subscribeToUser(callback: (user: HqUser | null) => void) {
  return onIdTokenChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null)
      return
    }
    const { claims } = await firebaseUser.getIdTokenResult()
    callback({
      id: firebaseUser.uid,
      name: firebaseUser.displayName ?? '',
      email: firebaseUser.email ?? '',
      role: (claims.role as Role) ?? null,
    })
  })
}

// undefined = still checking, null = signed out
export const AuthContext = createContext<HqUser | null | undefined>(undefined)

export function useAuth() {
  return useContext(AuthContext)
}
