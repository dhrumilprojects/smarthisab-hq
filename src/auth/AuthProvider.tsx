import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, subscribeToUser, type HqUser } from './auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<HqUser | null | undefined>(undefined)

  useEffect(() => subscribeToUser(setUser), [])

  return <AuthContext value={user}>{children}</AuthContext>
}
