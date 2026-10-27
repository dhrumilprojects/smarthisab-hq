import { logout, useAuth } from '../auth/auth'

export default function HomePage() {
  const user = useAuth()

  return (
    <main className="center">
      <h1>Welcome, {user?.name}</h1>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Sign out</button>
    </main>
  )
}
