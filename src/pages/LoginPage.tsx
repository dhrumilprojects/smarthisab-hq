import { login } from '../auth/auth'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-semibold">Smart Hisaab HQ</h1>
      <button className="rounded border px-4 py-2 hover:bg-gray-50" onClick={login}>
        Sign in with Google
      </button>
    </main>
  )
}
