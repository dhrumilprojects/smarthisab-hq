import { logout, useAuth } from '../auth/auth'

export default function HomePage() {
  const user = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
      <p>Role: {user?.role}</p>
      <button className="rounded border px-4 py-2 hover:bg-gray-50" onClick={logout}>
        Sign out
      </button>
    </main>
  )
}
