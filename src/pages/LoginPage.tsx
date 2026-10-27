import { login } from '../auth/auth'

export default function LoginPage() {
  return (
    <main className="center">
      <h1>Smart Hisaab HQ</h1>
      <button onClick={login}>Sign in with Google</button>
    </main>
  )
}
