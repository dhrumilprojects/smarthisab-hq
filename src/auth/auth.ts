import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { createContext, useContext } from 'react'
import { z } from 'zod'
import { auth, db } from '../data/firebase/app'

export type Role = 'admin' | 'support' | 'sales'

export type HqUser = {
  id: string
  name: string
  email: string
  photoUrl: string | null
  role: Role
}

// Whitelist: a document at hq_users/{email} gives that Google account access to HQ
const whitelistEntry = z.object({ role: z.enum(['admin', 'support', 'sales']) })

async function toHqUser(firebaseUser: User): Promise<HqUser | null> {
  const email = firebaseUser.email?.toLowerCase()
  if (!email) return null

  try {
    const entry = whitelistEntry.safeParse((await getDoc(doc(db, 'hq_users', email))).data())
    if (!entry.success) return null
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName ?? email,
      email,
      photoUrl: firebaseUser.photoURL,
      role: entry.data.role,
    }
  } catch {
    // Firestore rules deny the read when the email is not whitelisted
    return null
  }
}

export async function login() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const { user } = await signInWithPopup(auth, provider)

  if (!(await toHqUser(user))) {
    await signOut(auth)
    throw new Error(`${user.email} does not have access to HQ.`)
  }
}

export async function logout() {
  await signOut(auth)
}

// Signed-in accounts that are not whitelisted are signed out and reported as null
export function subscribeToUser(callback: (user: HqUser | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    const hqUser = firebaseUser && (await toHqUser(firebaseUser))
    if (firebaseUser && !hqUser) await signOut(auth)
    callback(hqUser)
  })
}

// undefined = still checking, null = signed out
export const AuthContext = createContext<HqUser | null | undefined>(undefined)

export function useAuth() {
  return useContext(AuthContext)
}
